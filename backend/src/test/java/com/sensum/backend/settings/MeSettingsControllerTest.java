package com.sensum.backend.settings;

import com.sensum.backend.SecurityConfig;
import com.sensum.backend.config.ApiExceptionHandler;
import com.sensum.backend.config.RequestIdFilter;
import com.sensum.backend.security.JwtAuthenticationFilter;
import com.sensum.backend.testutil.TestAuth;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MeSettingsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ApiExceptionHandler.class, RequestIdFilter.class})
class MeSettingsControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    UserSettingsRepository settings;

    @Test
    void getSettings_requiresAuth() throws Exception {
        mvc.perform(get("/me/settings"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getSettings_returnsSettings() throws Exception {
        UserSettings s = new UserSettings();
        s.userId = 1L;
        s.selectedPaths = "[]";
        s.nudgeThresholdSec = 480;
        s.trackedDomains = "[\"youtube.com\"]";

        when(settings.findById(1L)).thenReturn(Optional.of(s));

        mvc.perform(get("/me/settings")
                        .cookie(TestAuth.authCookie(1L, "a@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nudgeThresholdSec").value(480))
                .andExpect(jsonPath("$.trackedDomains").value("[\"youtube.com\"]"));
    }

    @Test
    void putSettings_updatesAndReturnsSettings() throws Exception {
        UserSettings s = new UserSettings();
        s.userId = 1L;

        when(settings.findById(1L)).thenReturn(Optional.of(s));
        when(settings.save(ArgumentMatchers.any(UserSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        mvc.perform(put("/me/settings")
                        .cookie(TestAuth.authCookie(1L, "a@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"selectedPaths\":\"[\\\"calm\\\"]\",\"nudgeThresholdSec\":120,\"trackedDomains\":\"[]\",\"shareLevel\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedPaths").value("[\"calm\"]"))
                .andExpect(jsonPath("$.nudgeThresholdSec").value(120))
                .andExpect(jsonPath("$.shareLevel").value(true));
    }
}
