FROM eclipse-temurin:25 AS jre-build
COPY . /app/codehorn/.

WORKDIR /app/codehorn

ARG CODEHORN_APP_VERSION

RUN chmod +x ./gradlew \
    && ./gradlew :problems-service:build -x test \
    && mv /app/codehorn/problems-service/build/libs/problems-service-${CODEHORN_APP_VERSION}.jar /app/codehorn/problems-service.jar \
    && apt update \
    && apt install unzip -y \
    && unzip /app/codehorn/problems-service.jar -d temp

RUN $JAVA_HOME/bin/jdeps \
      --print-module-deps \
      --ignore-missing-deps \
      --recursive \
      --multi-release 25 \
      --class-path="./temp/BOOT-INF/lib/*" \
      --module-path="./temp/BOOT-INF/lib/*" \
      /app/codehorn/problems-service.jar > ./jre-modules.txt \
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
COPY --from=jre-build /app/codehorn/problems-service.jar /app/problems-service.jar

RUN apt-get update && apt-get install curl -y

EXPOSE 80

CMD ["java", "-Dserver.port=80", "-jar", "/app/problems-service.jar"]
