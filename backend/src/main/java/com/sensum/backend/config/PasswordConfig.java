package com.sensum.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
/**
 * Password hashing configuration.
 *
 * <p>Defines the {@link PasswordEncoder} used by {@link com.sensum.backend.auth.AuthController}
 * to hash passwords at signup and verify them at login.
 */
public class PasswordConfig {

    /**
     * BCrypt encoder suitable for storing password hashes.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
