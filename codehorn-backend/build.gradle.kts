import org.jetbrains.kotlin.allopen.gradle.AllOpenExtension
import org.jetbrains.kotlin.gradle.dsl.KotlinJvmProjectExtension

plugins {
    alias(libs.plugins.kotlinJvmPlugin) apply false
    alias(libs.plugins.springPlugin) apply false
    alias(libs.plugins.springBootPlugin) apply false
    alias(libs.plugins.springDependencyManagementPlugin) apply false
    alias(libs.plugins.springJpaPlugin) apply false
    alias(libs.plugins.kotlinSerializationPlugin) apply false
}

group = "com.techullurgy.codehorn"
version = "0.0.1"

allprojects {
    repositories {
        mavenCentral()
    }
}

private val kotlinJvmPlugin = libs.plugins.kotlinJvmPlugin.get().pluginId
private val allOpenPlugin = libs.plugins.allOpenPlugin.get().pluginId

subprojects {
    group = "${rootProject.group}.${name}"
    version = rootProject.version

    tasks.withType<Test> {
        useJUnitPlatform()
    }

    // java {}
    plugins.withType<JavaPlugin> {
        extensions.configure<JavaPluginExtension> {
            toolchain {
                languageVersion.set(JavaLanguageVersion.of(25))
            }
        }
    }

    // kotlin {}
    plugins.withId(kotlinJvmPlugin) {
        extensions.configure<KotlinJvmProjectExtension> {
            compilerOptions {
                freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
            }
        }
    }

    // allOpen {}
    plugins.withId(allOpenPlugin) {
        extensions.configure<AllOpenExtension> {
            annotation("jakarta.persistence.Entity")
            annotation("jakarta.persistence.MappedSuperclass")
            annotation("jakarta.persistence.Embeddable")
        }
    }
}
