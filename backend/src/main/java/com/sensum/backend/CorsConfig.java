package com.sensum.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
/**
 * CORS configuration for local development.
 *
 * <p>Allows the Next.js dev server and the browser extension to call the API.
 * For production deployments, this should be tightened to the real frontend origins.
 */
public class CorsConfig {

    /**
     * Registers global CORS mappings.
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns("http://localhost:3000",
                                "chrome-extension://*"
                        )
                        .allowedMethods("*")
                        .allowedHeaders("*");
            }
        };
    }
}
