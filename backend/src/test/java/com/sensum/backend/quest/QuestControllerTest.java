package com.sensum.backend.quest;

import com.sensum.backend.SecurityConfig;
import com.sensum.backend.achievement.Achievement;
import com.sensum.backend.achievement.AchievementService;
import com.sensum.backend.config.ApiExceptionHandler;
import com.sensum.backend.config.RequestIdFilter;
import com.sensum.backend.friends.FriendshipRepository;
import com.sensum.backend.security.JwtAuthenticationFilter;
import com.sensum.backend.testutil.TestAuth;
import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = QuestController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ApiExceptionHandler.class, RequestIdFilter.class})
class QuestControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    QuestRepository questRepo;

    @MockitoBean
    UserRepository userRepo;

    @MockitoBean
    QuestCompletionRepository completionRepo;

    @MockitoBean
    AchievementService achievementService;

    @MockitoBean
    FriendshipRepository friendshipRepo;

    @Test
    void complete_requiresAuth() throws Exception {
        mvc.perform(post("/quests/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"questId\":1}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void complete_missingQuestId_returns400() throws Exception {
        mvc.perform(post("/quests/complete")
                        .cookie(TestAuth.authCookie(1L, "a@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("bad_request"));

        verify(completionRepo, never()).save(ArgumentMatchers.any());
    }

    @Test
    void complete_momentTooLong_returns400() throws Exception {
        Quest q = new Quest();
        q.setId(1L);
        q.setDurationSec(300);
        q.setCategory("calm");
        q.setTitle("t");
        q.setPrompt("p");

        User u = new User();
        u.id = 1L;
        u.email = "a@example.com";

        when(questRepo.findById(1L)).thenReturn(Optional.of(q));
        when(userRepo.findById(1L)).thenReturn(Optional.of(u));

        String longText = "a".repeat(201);
        String body = "{\"userId\":999999,\"questId\":1,\"mood\":\"ok\",\"momentText\":\"" + longText + "\"}";

        mvc.perform(post("/quests/complete")
                        .cookie(TestAuth.authCookie(1L, "a@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("bad_request"));

        verify(completionRepo, never()).save(ArgumentMatchers.any());
    }

    @Test
    void complete_ignoresBodyUserId_andUsesJwtUserId() throws Exception {
        Quest q = new Quest();
        q.setId(1L);
        q.setDurationSec(300);
        q.setCategory("calm");
        q.setTitle("t");
        q.setPrompt("p");

        User u = new User();
        u.id = 1L;
        u.email = "a@example.com";

        when(questRepo.findById(1L)).thenReturn(Optional.of(q));
        when(userRepo.findById(1L)).thenReturn(Optional.of(u));
        when(completionRepo.countByUserId(1L)).thenReturn(1L);
        when(friendshipRepo.countByUserIdAndStatus(1L, "accepted")).thenReturn(0L);
        when(achievementService.unlockAchievementsForUser(eq(1L), ArgumentMatchers.anyMap())).thenReturn(List.of());

        mvc.perform(post("/quests/complete")
                        .cookie(TestAuth.authCookie(1L, "a@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":999999,\"questId\":1,\"mood\":\"ok\",\"momentText\":\"hi\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gainedXp").value(50));

        ArgumentCaptor<QuestCompletion> captor = ArgumentCaptor.forClass(QuestCompletion.class);
        verify(completionRepo).save(captor.capture());
        QuestCompletion saved = captor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals(1L, saved.getUserId());
    }
}
