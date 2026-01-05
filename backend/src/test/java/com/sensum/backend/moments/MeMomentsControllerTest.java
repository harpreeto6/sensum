package com.sensum.backend.moments;

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

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MeMomentsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ApiExceptionHandler.class, RequestIdFilter.class})
class MeMomentsControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    MomentRepository moments;

    @Test
    void list_requiresAuth() throws Exception {
        mvc.perform(get("/me/moments"))
                .andExpect(status().isForbidden());
    }

    @Test
    void list_returnsMoments() throws Exception {
        Moment m = new Moment();
        m.setId(10L);
        m.setUserId(1L);
        m.setText("hello");
        m.setCreatedAt(Instant.parse("2020-01-01T00:00:00Z"));

        when(moments.findByUserIdOrderByCreatedAtDesc(ArgumentMatchers.eq(1L), ArgumentMatchers.any()))
                .thenReturn(List.of(m));

        mvc.perform(get("/me/moments")
                        .cookie(TestAuth.authCookie(1L, "a@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].text").value("hello"))
                .andExpect(jsonPath("$[0].createdAt").value("2020-01-01T00:00:00Z"));
    }

    @Test
    void create_requiresText() throws Exception {
        mvc.perform(post("/me/moments")
                        .cookie(TestAuth.authCookie(1L, "a@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_trimsAndReturnsMoment() throws Exception {
        when(moments.save(ArgumentMatchers.any(Moment.class))).thenAnswer(inv -> {
            Moment saved = inv.getArgument(0);
            saved.setId(55L);
            saved.setCreatedAt(Instant.parse("2020-01-01T00:00:00Z"));
            return saved;
        });

        mvc.perform(post("/me/moments")
                        .cookie(TestAuth.authCookie(1L, "a@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"  did a great focus session  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(55))
                .andExpect(jsonPath("$.text").value("did a great focus session"))
                .andExpect(jsonPath("$.createdAt").value("2020-01-01T00:00:00Z"));
    }
}
