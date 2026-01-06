package com.sensum.backend.stats;

import com.sensum.backend.SecurityConfig;
import com.sensum.backend.config.ApiExceptionHandler;
import com.sensum.backend.config.RequestIdFilter;
import com.sensum.backend.security.JwtAuthenticationFilter;
import com.sensum.backend.testutil.TestAuth;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = StatsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ApiExceptionHandler.class, RequestIdFilter.class})
class StatsControllerTest {

    private static final String SQL_TRACKED_SECONDS =
            "SELECT COALESCE(SUM(duration_sec), 0) " +
                    "FROM events " +
                    "WHERE user_id = ? AND event_type IN ('tick','time_spent') AND ts::date = CURRENT_DATE";

    private static final String SQL_NUDGES_SHOWN =
            "SELECT COUNT(*) FROM events WHERE user_id = ? AND event_type IN ('nudge','nudge_shown') AND ts::date = CURRENT_DATE";

    private static final String SQL_QUESTS_COMPLETED_TODAY =
            "SELECT COUNT(*) FROM quest_completions WHERE user_id = ? AND completed_at::date = CURRENT_DATE";

    private static final String SQL_QUESTS_AFTER_FIRST_NUDGE =
            "SELECT CASE " +
                    "WHEN (SELECT COUNT(*) FROM events WHERE user_id = ? AND event_type IN ('nudge','nudge_shown') AND ts::date = CURRENT_DATE) = 0 THEN 0 " +
                    "ELSE ( " +
                    "  SELECT COUNT(*) FROM quest_completions " +
                    "  WHERE user_id = ? AND completed_at >= ( " +
                    "    SELECT MIN(ts) FROM events WHERE user_id = ? AND event_type IN ('nudge','nudge_shown') AND ts::date = CURRENT_DATE " +
                    "  ) " +
                    ") END";

    @Autowired
    MockMvc mvc;

    @MockitoBean
    JdbcTemplate jdbc;

    @Test
    void today_requiresAuth() throws Exception {
        mvc.perform(get("/stats/today"))
                .andExpect(status().isForbidden());
    }

    @Test
    void today_isPerUser_andDoesNotLeakAcrossUsers() throws Exception {
        Long user1Id = 111L;
        Long user2Id = 222L;

        when(jdbc.queryForObject(eq(SQL_TRACKED_SECONDS), eq(Integer.class), eq(user1Id))).thenReturn(120);
        when(jdbc.queryForObject(eq(SQL_NUDGES_SHOWN), eq(Integer.class), eq(user1Id))).thenReturn(1);
        when(jdbc.queryForObject(eq(SQL_QUESTS_COMPLETED_TODAY), eq(Integer.class), eq(user1Id))).thenReturn(2);
        when(jdbc.queryForObject(eq(SQL_QUESTS_AFTER_FIRST_NUDGE), eq(Integer.class), eq(user1Id), eq(user1Id), eq(user1Id))).thenReturn(2);

        when(jdbc.queryForObject(eq(SQL_TRACKED_SECONDS), eq(Integer.class), eq(user2Id))).thenReturn(600);
        when(jdbc.queryForObject(eq(SQL_NUDGES_SHOWN), eq(Integer.class), eq(user2Id))).thenReturn(3);
        when(jdbc.queryForObject(eq(SQL_QUESTS_COMPLETED_TODAY), eq(Integer.class), eq(user2Id))).thenReturn(1);
        when(jdbc.queryForObject(eq(SQL_QUESTS_AFTER_FIRST_NUDGE), eq(Integer.class), eq(user2Id), eq(user2Id), eq(user2Id))).thenReturn(1);

        mvc.perform(get("/stats/today")
                        .cookie(TestAuth.authCookie(user1Id, "stats_u1@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackedSeconds").value(120))
                .andExpect(jsonPath("$.trackedMinutes").value(2))
                .andExpect(jsonPath("$.nudgesShown").value(1))
                .andExpect(jsonPath("$.questsCompletedToday").value(2))
                .andExpect(jsonPath("$.questsCompletedAfterFirstNudge").value(2));

        mvc.perform(get("/stats/today")
                        .cookie(TestAuth.authCookie(user2Id, "stats_u2@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackedSeconds").value(600))
                .andExpect(jsonPath("$.trackedMinutes").value(10))
                .andExpect(jsonPath("$.nudgesShown").value(3))
                .andExpect(jsonPath("$.questsCompletedToday").value(1))
                .andExpect(jsonPath("$.questsCompletedAfterFirstNudge").value(1));

        verify(jdbc).queryForObject(eq(SQL_TRACKED_SECONDS), eq(Integer.class), eq(user1Id));
        verify(jdbc).queryForObject(eq(SQL_NUDGES_SHOWN), eq(Integer.class), eq(user1Id));
        verify(jdbc).queryForObject(eq(SQL_QUESTS_COMPLETED_TODAY), eq(Integer.class), eq(user1Id));
        verify(jdbc).queryForObject(eq(SQL_QUESTS_AFTER_FIRST_NUDGE), eq(Integer.class), eq(user1Id), eq(user1Id), eq(user1Id));

        verify(jdbc).queryForObject(eq(SQL_TRACKED_SECONDS), eq(Integer.class), eq(user2Id));
        verify(jdbc).queryForObject(eq(SQL_NUDGES_SHOWN), eq(Integer.class), eq(user2Id));
        verify(jdbc).queryForObject(eq(SQL_QUESTS_COMPLETED_TODAY), eq(Integer.class), eq(user2Id));
        verify(jdbc).queryForObject(eq(SQL_QUESTS_AFTER_FIRST_NUDGE), eq(Integer.class), eq(user2Id), eq(user2Id), eq(user2Id));
    }
}