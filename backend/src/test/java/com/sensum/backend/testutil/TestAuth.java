package com.sensum.backend.testutil;

import com.sensum.backend.security.JwtAuthenticationFilter;
import com.sensum.backend.security.JwtUtil;
import jakarta.servlet.http.Cookie;

public final class TestAuth {

    private TestAuth() {
    }

    public static Cookie authCookie(long userId, String email) {
        String token = JwtUtil.generateToken(userId, email);
        return new Cookie(JwtAuthenticationFilter.COOKIE_NAME, token);
    }
}
