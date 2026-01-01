package com.sensum.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
/**
 * Spring Boot application entrypoint.
 *
 * <p>Bootstraps component scanning and auto-configuration for the Sensum backend.
 */
public class BackendApplication {

	/**
	 * Main method used by the JVM to start the application.
	 */
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
