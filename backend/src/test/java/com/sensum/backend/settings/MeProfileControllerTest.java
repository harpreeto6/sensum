package com.sensum.backend.settings;

import com.sensum.backend.SecurityConfig;
import com.sensum.backend.config.ApiExceptionHandler;
import com.sensum.backend.config.RequestIdFilter;
import com.sensum.backend.security.JwtAuthenticationFilter;
import com.sensum.backend.testutil.TestAuth;
import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MeProfileController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ApiExceptionHandler.class, RequestIdFilter.class})
class MeProfileControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    UserRepository users;

    @MockitoBean
    UserSettingsRepository settings;

    @Test
    void me_withoutAuth_isForbidden() throws Exception {
        mvc.perform(get("/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void me_withAuth_returnsUserAndSettings_andRequestIdHeader() throws Exception {
        User u = new User();
        u.id = 1L;
        u.email = "a@example.com";
        u.xp = 10;
        u.level = 1;
        u.streak = 2;

        UserSettings s = new UserSettings();
        s.userId = 1L;
        s.selectedPaths = "[\"calm\"]";
        s.nudgeThresholdSec = 480;
        s.trackedDomains = "[]";

        when(users.findById(1L)).thenReturn(Optional.of(u));
        when(settings.findById(1L)).thenReturn(Optional.of(s));

        mvc.perform(get("/me")
                        .cookie(TestAuth.authCookie(1L, "a@example.com")))
                .andExpect(status().isOk())
                .andExpect(header().exists(RequestIdFilter.HEADER))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("a@example.com"))
                .andExpect(jsonPath("$.settings.selectedPaths").value("[\"calm\"]"));
    }
}
