package com.sensum.backend;

import com.sensum.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
/**
 * Central Spring Security configuration for the backend.
 *
 * <h2>Security model</h2>
 * <ul>
 *   <li>Stateless authentication using JWT (see {@link JwtAuthenticationFilter}).</li>
 *   <li>No HTTP session state is stored server-side.</li>
 *   <li>CORS is enabled for the Next.js frontend and the browser extension.</li>
 * </ul>
 *
 * <h2>Public endpoints</h2>
 * <ul>
 *   <li>{@code /health} - basic availability endpoint.</li>
 *   <li>{@code /auth/signup}, {@code /auth/login} - authentication endpoints.</li>
 *   <li>{@code /metrics/**} - observability endpoints for external health checks.</li>
 * </ul>
 */
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    /**
     * Defines the security filter chain (the ordered set of security filters).
     *
     * <p>Key choices:</p>
     * <ul>
     *   <li>CSRF disabled because this API is used as a stateless JSON backend in development.</li>
     *   <li>Stateless session policy because JWT is used instead of server-side sessions.</li>
     *   <li>Custom JWT filter placed before username/password auth filter.</li>
     * </ul>
     */
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/health", "/error").permitAll()
                        .requestMatchers("/auth/signup", "/auth/login").permitAll()
                        .requestMatchers("/metrics", "/metrics/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    /**
     * CORS configuration for local development.
     *
     * <p>Allows:</p>
     * <ul>
     *   <li>Next.js dev server at {@code http://localhost:3000}</li>
     *   <li>Chromium extension origins ({@code chrome-extension://*})</li>
     * </ul>
     *
     * <p>Credentials are allowed so the browser can send cookies (JWT stored in HttpOnly cookie).</p>
     */
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow requests from Next.js dev server and extension.
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",      // Next.js frontend
            "chrome-extension://*"        // Browser extension
        ));

        // Allow credentials (cookies).
        configuration.setAllowCredentials(true);

        // Allow common HTTP methods.
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow all headers.
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Expose headers that frontend can read.
        configuration.setExposedHeaders(Arrays.asList("Set-Cookie"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}