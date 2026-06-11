FROM eclipse-temurin:25 AS jre-build
COPY . /app/codehorn/.

WORKDIR /app/codehorn

ARG CODEHORN_APP_VERSION

RUN chmod +x ./gradlew \
    && ./gradlew :cpp-execution-service:build -x test \
    && mv /app/codehorn/cpp-execution-service/build/libs/cpp-execution-service-${CODEHORN_APP_VERSION}.jar /app/codehorn/cpp-execution-service.jar \
    && apt update \
    && apt install unzip -y \
    && unzip /app/codehorn/cpp-execution-service.jar -d temp

RUN $JAVA_HOME/bin/jdeps \
      --print-module-deps \
      --ignore-missing-deps \
      --recursive \
      --multi-release 25 \
      --class-path="./temp/BOOT-INF/lib/*" \
      --module-path="./temp/BOOT-INF/lib/*" \
      /app/codehorn/cpp-execution-service.jar > ./jre-modules.txt \
    && $JAVA_HOME/bin/jlink \
      --verbose \
      --add-modules "$(cat ./jre-modules.txt)" \
      --strip-debug \
      --no-man-pages \
      --no-header-files \
      --compress=2 \
      --output /tmp/jre \
    && rm -rf temp

FROM debian:buster-slim
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH "${JAVA_HOME}/bin:${PATH}"
COPY --from=jre-build /tmp/jre $JAVA_HOME
COPY --from=jre-build /app/codehorn/cpp-execution-service.jar /app/cpp-execution-service.jar

RUN apt-get update && apt-get install -y ca-certificates curl gnupg \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian buster stable" | tee /etc/apt/keyrings/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli

EXPOSE 80

CMD ["java", "-Dserver.port=80", "-jar", "/app/cpp-execution-service.jar"]
