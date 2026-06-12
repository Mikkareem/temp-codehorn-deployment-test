package com.techullurgy.codehorn.gateway

import org.springframework.cloud.gateway.route.RouteLocator
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class CodehornGatewayRouterConfiguration {
    @Bean
    fun testRouteLocator(builder: RouteLocatorBuilder): RouteLocator {
        return builder.routes()
            .route("auth-route") { r ->
                r.path("/auth/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://auth-service")
            }
            .route("code-submission-route") { r ->
                r.path("/code-submission/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://code-submission-service")
            }
            .route("code-execution-route") { r ->
                r.path("/code-execution/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://code-execution-service")
            }
            .route("contest-route") { r ->
                r.path("/contest/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://contest-service")
            }
            .route("problems-route") { r ->
                r.path("/problems/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://problems-service")
            }
            .route("problem-submission-route") { r ->
                r.path("/problem-submission/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://problem-submission-service")
            }
            .route("daily-challenge-route") { r ->
                r.path("/daily-challenge/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://daily-challenge-service")
            }
            .route("cpp-execution-route") { r ->
                r.path("/cpp-execution/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://cpp-execution-service")
            }
            .route("java-execution-route") { r ->
                r.path("/java-execution/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://java-execution-service")
            }
            .route("python-execution-route") { r ->
                r.path("/python-execution/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://python-execution-service")
            }
            .route("javascript-execution-route") { r ->
                r.path("/javascript-execution/**")
                    .filters { f -> f.stripPrefix(1) }
                    .uri("lb://javascript-execution-service")
            }
            .build()
    }
}