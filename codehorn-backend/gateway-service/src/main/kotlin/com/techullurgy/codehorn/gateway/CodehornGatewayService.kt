package com.techullurgy.codehorn.gateway

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.client.discovery.EnableDiscoveryClient

@SpringBootApplication
@EnableDiscoveryClient
class CodehornGatewayServiceApplication

fun main(args: Array<String>) {
    runApplication<CodehornGatewayServiceApplication>(*args)
}