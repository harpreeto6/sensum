package com.sensum.backend.auth;

import org.springframework.web.bind.annotation.*;

import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public static class AuthRequest {
        public String email;
        public String password;
    }

    public static class AuthResponse {
        public Long userId;
        public AuthResponse(Long userId) { this.userId = userId; }
    }

    @PostMapping("/signup")
    public AuthResponse signup(@RequestBody AuthRequest req) {
        if (users.findByEmail(req.email).isPresent()) {
            throw new RuntimeException("Email already used");
        }
        User u = new User();
        u.email = req.email;
        u.passwordHash = encoder.encode(req.password);
        u.xp = 0; u.level = 1; u.streak = 0;
        users.save(u);
        return new AuthResponse(u.id);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest req) {
        User u = users.findByEmail(req.email).orElseThrow(() -> new RuntimeException("Bad login"));
        if (!encoder.matches(req.password, u.passwordHash)) {
            throw new RuntimeException("Bad login");
        }
        return new AuthResponse(u.id); // temporary “token”
    }
}
