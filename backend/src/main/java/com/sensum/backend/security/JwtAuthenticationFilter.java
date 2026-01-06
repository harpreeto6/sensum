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
 * Spring Security filter that authenticates requests using a Sensum JWT.
 *
 * <p>Supported transports:</p>
 * <ol>
 *   <li>Primary: HttpOnly cookie named {@link #COOKIE_NAME} (browser/web app flow).</li>
 *   <li>Fallback: {@code Authorization: Bearer <jwt>} header (extension flow).</li>
 * </ol>
 *
 * <p>Why the Bearer fallback exists:</p>
 * <ul>
 *   <li>The web app uses a SameSite cookie for auth.</li>
 *   <li>Browser extensions often cannot send SameSite cookies on cross-site fetches.</li>
 *   <li>Bearer auth allows the extension to authenticate without relying on cookie behavior.</li>
 * </ul>
 *
 * <p>Behavior:</p>
 * <ol>
 *   <li>Read JWT from cookie; if missing, read Bearer token.</li>
 *   <li>Validate token via {@link JwtUtil#validateToken(String)}.</li>
 *   <li>If valid, set {@link org.springframework.security.core.Authentication} and attach
 *       {@code userId} to the request.</li>
 * </ol>
 *
 * <p>If token is missing/invalid/expired, the request continues unauthenticated. Authorization is
 * enforced later by Spring Security configuration.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // Cookie name we’ll set on login/signup
    public static final String COOKIE_NAME = "sensum_token";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private static String readBearerToken(HttpServletRequest request) {
        String header = request.getHeader(AUTHORIZATION_HEADER);
        if (header == null) return null;
        if (!header.startsWith(BEARER_PREFIX)) return null;
        String token = header.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }

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

        // 1) Read cookie first (browser -> backend flow)
        String token = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if (COOKIE_NAME.equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }

        // 2) Fallback: read Authorization: Bearer <token> (extension/mobile flows)
        if (token == null || token.isBlank()) {
            token = readBearerToken(request);
        }

        // 3) If no token, continue without auth
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