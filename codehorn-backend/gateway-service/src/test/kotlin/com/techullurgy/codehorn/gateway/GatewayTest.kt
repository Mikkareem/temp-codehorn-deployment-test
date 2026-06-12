package com.techullurgy.codehorn.gateway

import com.github.tomakehurst.wiremock.WireMockServer
import com.github.tomakehurst.wiremock.client.WireMock.*
import com.github.tomakehurst.wiremock.core.WireMockConfiguration.options
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.cloud.client.DefaultServiceInstance
import org.springframework.cloud.client.ServiceInstance
import org.springframework.cloud.loadbalancer.annotation.LoadBalancerClient
import org.springframework.cloud.loadbalancer.annotation.LoadBalancerClients
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier
import org.springframework.context.annotation.Bean
import org.springframework.test.web.reactive.server.WebTestClient
import reactor.core.publisher.Flux

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = [
        "spring.cloud.consul.enabled=false",
        "spring.cloud.consul.discovery.enabled=false"
    ]
)
@LoadBalancerClients(
    LoadBalancerClient("contest-service", configuration = [ContestServiceConfig::class]),
    LoadBalancerClient("auth-service", configuration = [AuthServiceConfig::class])
)
class GatewayTest {

    @LocalServerPort
    private var port: Int = 0

    private lateinit var webTestClient: WebTestClient

    companion object {
        private lateinit var wireMockServer: WireMockServer

        @BeforeAll
        @JvmStatic
        fun startWireMock() {
            wireMockServer = WireMockServer(options().port(4857))
            wireMockServer.start()
            configureFor("localhost", wireMockServer.port())
        }

        @AfterAll
        @JvmStatic
        fun stopWireMock() {
            wireMockServer.stop()
        }
    }

    @BeforeEach
    fun setUp() {
        webTestClient = WebTestClient.bindToServer()
            .baseUrl("http://localhost:$port")
            .build()
    }

    @Test
    fun shouldBeAbleToReachContestService() {
        stubFor(
            get(urlEqualTo("/test"))
                .willReturn(
                    aResponse()
                        .withStatus(200)
                        .withBody("OK")
                )
        )

        webTestClient.get()
            .uri("/contest/test")
            .exchange()
            .expectStatus().isOk
            .expectBody(String::class.java).isEqualTo("OK")

        webTestClient.get()
            .uri("/auth/test")
            .exchange()
            .expectStatus().isOk
            .expectBody(String::class.java).isEqualTo("OK")

        verify(2,getRequestedFor(urlEqualTo("/test")))
    }
}

private class ContestServiceConfig {
    @Bean
    fun testServiceInstanceListSupplier(): ServiceInstanceListSupplier {
        return object : ServiceInstanceListSupplier {
            override fun getServiceId(): String = "contest-service"
            override fun get(): Flux<List<ServiceInstance>> {
                return Flux.just(
                    listOf(
                        DefaultServiceInstance(
                            "contest-1",
                            "contest-service",
                            "localhost",
                            4857,
                            false
                        )
                    )
                )
            }
        }
    }
}

private class AuthServiceConfig {
    @Bean
    fun testServiceInstanceListSupplier(): ServiceInstanceListSupplier {
        return object : ServiceInstanceListSupplier {
            override fun getServiceId(): String = "auth-service"
            override fun get(): Flux<List<ServiceInstance>> {
                return Flux.just(
                    listOf(
                        DefaultServiceInstance(
                            "auth-1",
                            "auth-service",
                            "localhost",
                            4857,
                            false
                        )
                    )
                )
            }
        }
    }
}