package com.sharingan_comics.sharingan_comics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.sharingan_comics.sharingan_comics.clerk.ClerkProperties;

/**
 * SharinganComicsApplication
 * --------------------------
 * Punto de entrada de Spring Boot.
 * @EnableConfigurationProperties registra ClerkProperties para inyección tipada.
 */
@SpringBootApplication
@EnableConfigurationProperties(ClerkProperties.class)
public class SharinganComicsApplication {

	public static void main(String[] args) {
		SpringApplication.run(SharinganComicsApplication.class, args);
	}

}
