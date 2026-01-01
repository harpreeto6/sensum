package com.sensum.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Small utility for issuing and validating JSON Web Tokens (JWTs).
 *
 * <p>The Sensum backend uses a cookie-based JWT session. Tokens are issued at login/signup and
 * are validated by {@link JwtAuthenticationFilter} on each request.
 *
 * <h2>Token shape</h2>
 * <ul>
 *   <li><b>Subject:</b> user id</li>
 *   <li><b>Claim:</b> {@code email}</li>
 *   <li><b>Expiration:</b> {@link #EXPIRATION_MS}</li>
 * </ul>
 *
 * <p><b>Important:</b> The signing key is hard-coded for local development. In production,
 * move it to an environment variable or secret manager.
 */
public class JwtUtil {

    // In real prod, move this to env/config; must be 256-bit for HS256
    private static final SecretKey SECRET = Keys.hmacShaKeyFor(
            "change-this-secret-to-a-longer-32-byte-value!".getBytes()
    );

    // 7 days
    private static final long EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000L;

    /**
     * Creates a signed JWT.
     *
     * @param userId user id to embed as the JWT subject
     * @param email email address to embed as a claim
     * @return compact JWS string (HS256)
     */
    public static String generateToken(Long userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + EXPIRATION_MS);

        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("email", email)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(SECRET, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validates a token and returns its claims.
     *
     * <p>This method throws if the token is expired, malformed, or has an invalid signature.
     * Callers that want "best effort" behavior should catch exceptions.
     */
    public static Claims validateToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}