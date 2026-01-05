package com.sensum.backend.quest;

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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MeQuestCompletionsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ApiExceptionHandler.class, RequestIdFilter.class})
class MeQuestCompletionsControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    QuestCompletionRepository completions;

    @MockitoBean
    QuestRepository quests;

    @Test
    void list_requiresAuth() throws Exception {
        mvc.perform(get("/me/quests/completions"))
                .andExpect(status().isForbidden());
    }

    @Test
    void list_returnsCompletions() throws Exception {
        QuestCompletion c = new QuestCompletion();
        c.setId(99L);
        c.setUserId(1L);
        c.setQuestId(5L);
        c.setMood("calm");
        c.setMomentText("did it");
        c.setCompletedAt(Instant.parse("2020-01-01T00:00:00Z"));

        Quest q = new Quest();
        q.setId(5L);
        q.setTitle("Breathe");
        q.setCategory("calm");

        when(completions.findByUserIdOrderByCompletedAtDesc(ArgumentMatchers.eq(1L), ArgumentMatchers.any()))
                .thenReturn(List.of(c));
        when(quests.findAllById(ArgumentMatchers.any())).thenReturn(List.of(q));

        mvc.perform(get("/me/quests/completions")
                        .cookie(TestAuth.authCookie(1L, "a@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(99))
                .andExpect(jsonPath("$[0].questId").value(5))
                .andExpect(jsonPath("$[0].title").value("Breathe"))
                .andExpect(jsonPath("$[0].category").value("calm"))
                .andExpect(jsonPath("$[0].mood").value("calm"))
                .andExpect(jsonPath("$[0].momentText").value("did it"))
                .andExpect(jsonPath("$[0].completedAt").value("2020-01-01T00:00:00Z"));
    }
}
