FROM eclipse-temurin:25 AS jre-build
COPY . /app/codehorn/.

WORKDIR /app/codehorn

ARG CODEHORN_APP_VERSION

RUN chmod +x ./gradlew \
    && ./gradlew :daily-challenge-service:build -x test \
    && mv /app/codehorn/daily-challenge-service/build/libs/daily-challenge-service-${CODEHORN_APP_VERSION}.jar /app/codehorn/daily-challenge-service.jar \
    && apt update \
    && apt install unzip -y \
    && unzip /app/codehorn/daily-challenge-service.jar -d temp

RUN $JAVA_HOME/bin/jdeps \
      --print-module-deps \
      --ignore-missing-deps \
      --recursive \
      --multi-release 25 \
      --class-path="./temp/BOOT-INF/lib/*" \
      --module-path="./temp/BOOT-INF/lib/*" \
      /app/codehorn/daily-challenge-service.jar > ./jre-modules.txt \
    && $JAVA_HOME/bin/jlink \
      --verbose \
      --add-modules "$(cat ./jre-modules.txt)" \
      --strip-debug \
      --no-man-pages \
      --no-header-files \
      --compress=2 \
      --output /tmp/jre \
    && rm -rf temp

FROM debian:bookworm-slim
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH "${JAVA_HOME}/bin:${PATH}"
COPY --from=jre-build /tmp/jre $JAVA_HOME
COPY --from=jre-build /app/codehorn/daily-challenge-service.jar /app/daily-challenge-service.jar

RUN apt-get update && apt-get install curl -y

EXPOSE 80

CMD ["java", "-Dserver.port=80", "-jar", "/app/daily-challenge-service.jar"]
