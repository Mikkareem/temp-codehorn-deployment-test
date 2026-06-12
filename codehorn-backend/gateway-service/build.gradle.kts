plugins {
    alias(libs.plugins.kotlinJvmPlugin)
    alias(libs.plugins.springPlugin)
    alias(libs.plugins.springBootPlugin)
    alias(libs.plugins.springDependencyManagementPlugin)
}

dependencies {
    implementation(libs.kotlin.reflect)
    implementation(libs.jackson.module.kotlin)
    testImplementation(libs.kotlin.test.junit5)
    testImplementation(libs.spring.boot.starter.test)
    testImplementation("org.wiremock:wiremock-standalone:3.6.0")
    testRuntimeOnly(libs.junit.platform.launcher)

    implementation(libs.spring.boot.starter.actuator)

    implementation(platform(libs.spring.cloud.bom))
    implementation(libs.spring.cloud.starter.gateway.server.webflux)
    implementation(libs.spring.cloud.starter.consul.discovery)
    implementation(libs.spring.cloud.starter.loadbalancer)
}