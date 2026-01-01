package com.sensum.backend.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
/**
 * Spring Security filter that authenticates requests using the Sensum JWT cookie.
 *
 * <p>Behavior:
 * <ol>
 *   <li>Reads the JWT from the {@link #COOKIE_NAME} cookie.</li>
 *   <li>Validates the token via {@link JwtUtil#validateToken(String)}.</li>
 *   <li>If valid, sets an {@link org.springframework.security.core.Authentication} in the
 *       {@link SecurityContextHolder}.</li>
 *   <li>Also attaches {@code userId} to {@link HttpServletRequest} attributes for controller code
 *       that prefers request-scoped access.</li>
 * </ol>
 *
 * <p>If the token is missing, invalid, or expired, the request continues unauthenticated.
 * Authorization is enforced later by Spring Security configuration.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // Cookie name we’ll set on login/signup
    public static final String COOKIE_NAME = "sensum_token";

    @Override
    /**
     * Attempts to authenticate the current request based on the JWT cookie.
     *
     * <p>This filter is intentionally permissive: it never directly returns 401; it only
     * establishes authentication when possible.
     */
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1) Read cookie
        String token = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if (COOKIE_NAME.equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }

        // 2) If no token, continue without auth
        if (token != null) {
            try {
                Claims claims = JwtUtil.validateToken(token);
                Long userId = Long.valueOf(claims.getSubject());
                String email = claims.get("email", String.class);

                // 3) Build an Authentication object (no roles for now)
                User principal = new User(email, "", Collections.emptyList());
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 4) Set it into the SecurityContext
                SecurityContextHolder.getContext().setAuthentication(auth);

                // You might want to attach userId somewhere handy for controllers:
                request.setAttribute("userId", userId);

            } catch (Exception ex) {
                // invalid/expired token: ignore and continue without auth
            }
        }

        filterChain.doFilter(request, response);
    }
}