package com.sensum.backend.auth;

import com.sensum.backend.security.JwtAuthenticationFilter;
import com.sensum.backend.security.JwtUtil;
import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
/**
 * Authentication entrypoint for the Sensum backend.
 *
 * <p>This controller implements a simple email+password authentication flow and issues a JWT
 * inside an HttpOnly cookie. The cookie is read on subsequent requests by
 * {@link JwtAuthenticationFilter}, which sets the Spring Security authentication and attaches
 * the authenticated user id to the request.
 *
 * <h2>Security model</h2>
 * <ul>
 *   <li><b>Session transport:</b> HttpOnly cookie (not accessible to JavaScript).</li>
 *   <li><b>Session contents:</b> JWT containing the user id (subject) and the email claim.</li>
 *   <li><b>Logout:</b> clears the cookie (maxAge=0).</li>
 * </ul>
 *
 * <p><b>Note:</b> This controller currently returns HTTP 200 for successful signup/login, and
 * uses {@link IllegalArgumentException} for validation failures (mapped to 400 by
 * {@code ApiExceptionHandler}). Login failures return HTTP 401 with a body containing
 * {@code userId=null}.
 */
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    /**
     * Request body for {@link #signup(AuthRequest)} and {@link #login(AuthRequest)}.
     *
     * @param email user email address (required; non-blank)
     * @param password raw password (required; non-blank)
     */
    public record AuthRequest(String email, String password) {}

    /**
     * Response body for {@link #signup(AuthRequest)} and {@link #login(AuthRequest)}.
     *
     * @param userId id of the authenticated user when successful; may be null for 401 responses
     */
    public record AuthResponse(Long userId) {}

    /**
     * Creates a new user account.
     *
     * <p>On success, returns HTTP 200, sets an HttpOnly JWT cookie, and returns the new user id.
     *
     * <h3>Validation</h3>
     * <ul>
     *   <li>Rejects missing/blank email or password (400).</li>
     *   <li>Rejects if the email already exists (400).</li>
     * </ul>
     */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody AuthRequest req) {
        if (req == null || req.email() == null || req.email().isBlank() || req.password() == null || req.password().isBlank()) {
            throw new IllegalArgumentException("email and password are required");
        }
        if (users.findByEmail(req.email()).isPresent()) {
            throw new IllegalArgumentException("Email already used");
        }
        User u = new User();
        u.email = req.email();
        u.passwordHash = encoder.encode(req.password());
        u.xp = 0; u.level = 1; u.streak = 0;
        users.save(u);

        return withTokenCookie(u);
    }

    /**
     * Authenticates an existing user.
     *
     * <p>On success, returns HTTP 200, sets an HttpOnly JWT cookie, and returns the user id.
     * On authentication failure, returns HTTP 401.
     *
     * <h3>Validation</h3>
     * <ul>
     *   <li>Rejects missing/blank email or password (400).</li>
     * </ul>
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {
        if (req == null || req.email() == null || req.email().isBlank() || req.password() == null || req.password().isBlank()) {
            throw new IllegalArgumentException("email and password are required");
        }

        User u = users.findByEmail(req.email())
                .orElse(null);
        if (u == null) {
            return ResponseEntity.status(401).body(new AuthResponse(null));
        }
        if (!encoder.matches(req.password(), u.passwordHash)) {
            return ResponseEntity.status(401).body(new AuthResponse(null));
        }
        return withTokenCookie(u);
    }

    /**
     * Logs the caller out by clearing the JWT cookie.
     *
     * <p>This is a client-side session invalidation only. Since JWTs are stateless, the token is
     * not revoked server-side.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Clear the cookie by setting maxAge=0
        ResponseCookie clear = ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false) // set true if using HTTPS
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();
        return ResponseEntity.ok()
                .header("Set-Cookie", clear.toString())
                .build();
    }

    /**
     * Builds a response containing an HttpOnly JWT cookie and the authenticated user's id.
     *
     * <p>The cookie is created using the shared name defined in {@link JwtAuthenticationFilter}.
     */
    private ResponseEntity<AuthResponse> withTokenCookie(User u) {
        String token = JwtUtil.generateToken(u.id, u.email);

        ResponseCookie cookie = ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, token)
                .httpOnly(true)
                .secure(false) // set true in production (HTTPS)
                .path("/")
                .sameSite("Lax") // Lax ->allows normal navigation; blocks most CSRF
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .build();

        return ResponseEntity.ok()
                .header("Set-Cookie", cookie.toString())
                .body(new AuthResponse(u.id));
    }
}