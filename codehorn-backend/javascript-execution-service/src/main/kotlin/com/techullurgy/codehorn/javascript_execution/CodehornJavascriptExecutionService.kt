package com.techullurgy.codehorn.javascript_execution

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
class CodehornJavascriptExecutionServiceApplication

fun main(args: Array<String>) {
    runApplication<CodehornJavascriptExecutionServiceApplication>(*args)
}