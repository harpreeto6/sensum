package com.sensum.backend.stats;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stats")
public class StatsController {

    private final JdbcTemplate jdbc;

    public StatsController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record TodayStatsResponse(
            int trackedSeconds,
            int trackedMinutes,
            int nudgesShown,
            int questsCompletedToday,
            int questsCompletedAfterFirstNudge
    ) {}

    @GetMapping("/today")
    public TodayStatsResponse today() {
        Integer trackedSeconds = jdbc.queryForObject(
                "SELECT COALESCE(SUM(duration_sec), 0) " +
                        "FROM events " +
                        "WHERE event_type = 'tick' AND ts::date = CURRENT_DATE",
                Integer.class
        );

        Integer nudgesShown = jdbc.queryForObject(
                "SELECT COUNT(*) FROM events WHERE event_type = 'nudge' AND ts::date = CURRENT_DATE",
                Integer.class
        );

        Integer questsCompletedToday = jdbc.queryForObject(
                "SELECT COUNT(*) FROM quest_completions WHERE completed_at::date = CURRENT_DATE",
                Integer.class
        );

        Integer questsAfterFirstNudge = jdbc.queryForObject(
                "SELECT CASE " +
                        "WHEN (SELECT COUNT(*) FROM events WHERE event_type = 'nudge' AND ts::date = CURRENT_DATE) = 0 THEN 0 " +
                        "ELSE ( " +
                        "  SELECT COUNT(*) FROM quest_completions " +
                        "  WHERE completed_at >= ( " +
                        "    SELECT MIN(ts) FROM events WHERE event_type = 'nudge' AND ts::date = CURRENT_DATE " +
                        "  ) " +
                        ") END",
                Integer.class
        );

        int seconds = trackedSeconds == null ? 0 : trackedSeconds;
        int minutes = seconds / 60;

        return new TodayStatsResponse(
                seconds,
                minutes,
                nudgesShown == null ? 0 : nudgesShown,
                questsCompletedToday == null ? 0 : questsCompletedToday,
                questsAfterFirstNudge == null ? 0 : questsAfterFirstNudge
        );
    }
}