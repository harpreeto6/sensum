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
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public record AuthRequest(String email, String password) {}
    public record AuthResponse(Long userId) {}

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