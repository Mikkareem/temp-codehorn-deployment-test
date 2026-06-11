package com.techullurgy.codehorn.auth

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.client.discovery.EnableDiscoveryClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.core.env.Environment

@RestController
class TestController(
    private val environment: Environment
) {
    @GetMapping("/test")
    fun testEndpoint(): String {
        return "Hello from ${environment.getProperty("spring.application.name")}"
    }
}

@SpringBootApplication
@EnableDiscoveryClient
class CodehornAuthServiceApplication

fun main(args: Array<String>) {
    runApplication<CodehornAuthServiceApplication>(*args)
}