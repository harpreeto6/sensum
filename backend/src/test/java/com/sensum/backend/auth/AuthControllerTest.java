package com.sensum.backend.auth;

import com.sensum.backend.SecurityConfig;
import com.sensum.backend.config.ApiExceptionHandler;
import com.sensum.backend.config.RequestIdFilter;
import com.sensum.backend.security.JwtAuthenticationFilter;
import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ApiExceptionHandler.class, RequestIdFilter.class})
class AuthControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    UserRepository users;

    @MockitoBean
    PasswordEncoder encoder;

    @Test
    void login_withMissingFields_returns400() throws Exception {
        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("bad_request"));
    }

    @Test
    void login_withBadCredentials_returns401() throws Exception {
        when(users.findByEmail("nope@example.com")).thenReturn(Optional.empty());

        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nope@example.com\",\"password\":\"bad\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.userId").doesNotExist());
    }

    @Test
    void login_withGoodCredentials_setsCookieAndReturns200() throws Exception {
        User u = new User();
        u.id = 123L;
        u.email = "a@example.com";
        u.passwordHash = "hash";

        when(users.findByEmail("a@example.com")).thenReturn(Optional.of(u));
        when(encoder.matches("pw", "hash")).thenReturn(true);

        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@example.com\",\"password\":\"pw\"}"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("sensum_token=")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("HttpOnly")))
                .andExpect(header().exists(RequestIdFilter.HEADER))
                .andExpect(jsonPath("$.userId").value(123));
    }

    @Test
    void signup_existingEmail_returns400() throws Exception {
        when(users.findByEmail("taken@example.com")).thenReturn(Optional.of(new User()));

        mvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"taken@example.com\",\"password\":\"pw\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("bad_request"));
    }

    @Test
    void signup_newEmail_setsCookieAndReturns200() throws Exception {
        when(users.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(encoder.encode("pw")).thenReturn("hash");
        when(users.save(ArgumentMatchers.any(User.class))).thenAnswer(inv -> {
            User saved = inv.getArgument(0);
            saved.id = 7L;
            return saved;
        });

        mvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"new@example.com\",\"password\":\"pw\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("sensum_token=")))
                .andExpect(jsonPath("$.userId").value(7));
    }
}
