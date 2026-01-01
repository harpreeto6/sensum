package com.sensum.backend.observability;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * REST API for lightweight application observability.
 *
 * <h2>Endpoints</h2>
 * <ul>
 *   <li><b>GET /metrics</b> - returns counters, rates, average latency, uptime, and a coarse health status.</li>
 *   <li><b>GET /metrics/health</b> - returns a simple UP/DOWN signal intended for load balancers and monitors.</li>
 * </ul>
 *
 * <h2>Auth</h2>
 * These endpoints are intentionally permitted without authentication (see {@code SecurityConfig}) so external
 * health checkers can call them.
 */
@RestController
@RequestMapping("/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    /**
     * Returns detailed metrics about the running backend.
     *
     * <p>Response fields are meant to be human-friendly (strings like "12.34%"), so this endpoint can be
     * easily read in the browser while developing.</p>
     *
     * @return map containing counters, derived rates, average latency, uptime, and status
     */
    @GetMapping
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // Request counts
        metrics.put("totalRequests", metricsService.getTotalRequests());
        metrics.put("successfulRequests", metricsService.getSuccessfulRequests());
        metrics.put("clientErrors", metricsService.getClientErrors());
        metrics.put("serverErrors", metricsService.getServerErrors());
        metrics.put("slowRequests", metricsService.getSlowRequestCount());
        
        // Rates and averages
        metrics.put("successRate", String.format("%.2f%%", metricsService.getSuccessRate()));
        metrics.put("errorRate", String.format("%.2f%%", metricsService.getErrorRate()));
        metrics.put("avgResponseTimeMs", String.format("%.2f", metricsService.getAverageResponseTimeMs()));
        
        // Application info
        metrics.put("uptime", metricsService.getUptime());
        metrics.put("startTime", metricsService.getStartTime().toString());
        
        // Health status (simple rule: healthy if error rate < 5%).
        boolean healthy = metricsService.getErrorRate() < 5.0;
        metrics.put("status", healthy ? "healthy" : "degraded");
        
        return metrics;
    }

    /**
     * Small health-check endpoint meant for monitors.
     *
     * <p>Heuristic:</p>
     * <ul>
     *   <li>Error rate must be under 5%</li>
     *   <li>Average response time must be under 2000ms</li>
     * </ul>
     *
     * @return map containing status (UP/DOWN) and uptime
     */
    @GetMapping("/health")
    public Map<String, String> getHealth() {
        boolean healthy = metricsService.getErrorRate() < 5.0 && 
                         metricsService.getAverageResponseTimeMs() < 2000;
        
        return Map.of(
            "status", healthy ? "UP" : "DOWN",
            "uptime", metricsService.getUptime()
        );
    }
}
