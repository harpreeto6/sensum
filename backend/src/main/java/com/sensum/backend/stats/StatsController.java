package com.sensum.backend.stats;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Analytics endpoints for surfacing "impact" metrics in the UI.
 *
 * <h2>Data sources</h2>
 * <ul>
 *   <li>{@code events} table - time spent events and nudge events coming from the browser extension.</li>
 *   <li>{@code quest_completions} table - quest completion history.</li>
 * </ul>
 *
 * <h2>Why JdbcTemplate?</h2>
 * These endpoints intentionally use {@link JdbcTemplate} with simple SQL for readability and to avoid
 * building a full analytics domain model.
 */
@RestController
@RequestMapping("/stats")
public class StatsController {

    private final JdbcTemplate jdbc;

    public StatsController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Response payload for {@link #today()}.
     *
     * @param trackedSeconds total tracked seconds for today
     * @param trackedMinutes tracked seconds converted to whole minutes
     * @param nudgesShown number of nudges shown today
     * @param questsCompletedToday number of quests completed today
     * @param questsCompletedAfterFirstNudge number of quests completed after the first nudge today
     */
    public record TodayStatsResponse(
            int trackedSeconds,
            int trackedMinutes,
            int nudgesShown,
            int questsCompletedToday,
            int questsCompletedAfterFirstNudge
    ) {}

    /**
     * Returns global "today" metrics.
     *
        * <p><b>Important:</b> this endpoint is per-user and requires authentication. The authenticated
        * user id is read from the request attribute "userId" which is set by the JWT authentication filter.</p>
     *
     * <p>Event name compatibility:</p>
     * <ul>
     *   <li>Older extension versions used {@code tick} and {@code nudge}.</li>
     *   <li>Newer extension versions use {@code time_spent} and {@code nudge_shown}.</li>
     * </ul>
     * This endpoint counts both to remain backward compatible.</p>
     */
    @GetMapping("/today")
    public TodayStatsResponse today(jakarta.servlet.http.HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        if (userId == null) {
            return new TodayStatsResponse(0, 0, 0, 0, 0);
        }

        Integer trackedSeconds = jdbc.queryForObject(
                "SELECT COALESCE(SUM(duration_sec), 0) " +
                        "FROM events " +
                        "WHERE user_id = ? AND event_type IN ('tick','time_spent') AND ts::date = CURRENT_DATE",
                Integer.class,
                userId
        );

        Integer nudgesShown = jdbc.queryForObject(
                "SELECT COUNT(*) FROM events WHERE user_id = ? AND event_type IN ('nudge','nudge_shown') AND ts::date = CURRENT_DATE",
                Integer.class,
                userId
        );

        Integer questsCompletedToday = jdbc.queryForObject(
                "SELECT COUNT(*) FROM quest_completions WHERE user_id = ? AND completed_at::date = CURRENT_DATE",
                Integer.class,
                userId
        );

        Integer questsAfterFirstNudge = jdbc.queryForObject(
                "SELECT CASE " +
                        "WHEN (SELECT COUNT(*) FROM events WHERE user_id = ? AND event_type IN ('nudge','nudge_shown') AND ts::date = CURRENT_DATE) = 0 THEN 0 " +
                        "ELSE ( " +
                        "  SELECT COUNT(*) FROM quest_completions " +
                        "  WHERE user_id = ? AND completed_at >= ( " +
                        "    SELECT MIN(ts) FROM events WHERE user_id = ? AND event_type IN ('nudge','nudge_shown') AND ts::date = CURRENT_DATE " +
                        "  ) " +
                        ") END",
                Integer.class,
                userId,
                userId,
                userId
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

        /**
         * Returns per-user summary analytics.
         *
         * <p>This endpoint requires authentication. The user id is read from the request attribute
         * "userId" which is set by the JWT authentication filter.</p>
         *
         * <p>Range is currently accepted but not yet used to filter results (MVP simplification after
         * earlier SQL date-range issues). It can be expanded later to filter by last N days.</p>
         *
         * @param range requested range in days (currently unused)
         * @param req http request used to read authenticated user id
         */
    @GetMapping("/summary")
    public SummaryStatsResponse summary(
            @RequestParam(defaultValue = "7") int range,
            jakarta.servlet.http.HttpServletRequest req
    ) {
        Long userId = (Long) req.getAttribute("userId");
        if (userId == null) {
            // Return empty stats for now (better than crashing)
            return new SummaryStatsResponse(0, 0, 0, 0, 0.0, new java.util.ArrayList<>());
        }

        try {
                        // Simple queries that should work across environments.
            Integer totalSeconds = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(duration_sec), 0) FROM events WHERE user_id = ?",
                    Integer.class,
                    userId
            );

            Integer nudgesShown = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM events WHERE user_id = ? AND event_type = 'nudge_shown'",
                    Integer.class,
                    userId
            );

            Integer nudgesClicked = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM events WHERE user_id = ? AND event_type = 'nudge_clicked'",
                    Integer.class,
                    userId
            );

            Integer questsCompleted = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM quest_completions WHERE user_id = ?",
                    Integer.class,
                    userId
            );

            double swapRate = nudgesShown > 0 ? (nudgesClicked * 100.0 / nudgesShown) : 0;

            // For now, return empty daily breakdown (future enhancement).
            return new SummaryStatsResponse(
                    totalSeconds / 60,
                    nudgesShown,
                    nudgesClicked,
                    questsCompleted,
                    swapRate,
                    new java.util.ArrayList<>()
            );
        } catch (Exception e) {
            // Log the error and return zeros (avoid crashing the UI).
            System.err.println("Error in stats summary: " + e.getMessage());
            e.printStackTrace();
            return new SummaryStatsResponse(0, 0, 0, 0, 0.0, new java.util.ArrayList<>());
        }
    }

    /** Response payload for {@link #summary(int, jakarta.servlet.http.HttpServletRequest)}. */
    public record SummaryStatsResponse(
            int totalMinutes,
            int nudgesShown,
            int nudgesClicked,
            int questsCompleted,
            double swapRate,
            java.util.List<DailyStats> dailyBreakdown
    ) {}

    /**
     * Placeholder structure for a future daily breakdown chart.
     *
     * @param date ISO-8601 date string
     * @param minutes minutes tracked for that day
     * @param nudges nudges shown that day
     * @param quests quests completed that day
     */
    public record DailyStats(
            String date,
            int minutes,
            int nudges,
            int quests
    ) {}
}