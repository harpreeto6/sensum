package com.sensum.backend.observability;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Spring MVC {@link HandlerInterceptor} that implements lightweight request observability.
 *
 * <h2>Responsibilities</h2>
 * <ul>
 *   <li>Measures end-to-end controller handling time for each HTTP request.</li>
 *   <li>Logs a single line per request with method, URI, duration, and HTTP status.</li>
 *   <li>Updates in-memory counters in {@link MetricsService} for quick health checks.</li>
 * </ul>
 *
 * <h2>Where it runs in the request lifecycle</h2>
 * <ol>
 *   <li>{@link #preHandle(HttpServletRequest, HttpServletResponse, Object)} runs before the controller.</li>
 *   <li>{@link #afterCompletion(HttpServletRequest, HttpServletResponse, Object, Exception)} runs after the request completes.</li>
 * </ol>
 *
 * <h2>Notes</h2>
 * This is intentionally simple and does not replace production-grade solutions
 * like Micrometer + Prometheus/Grafana.
 */
@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        /**
         * Stores a start timestamp on the request so {@link #afterCompletion} can calculate duration.
         *
         * We use the request attribute map because it is per-request (thread-safe by design)
         * and does not require any global state.
         */
        request.setAttribute("startTime", System.currentTimeMillis());

        // Continue processing the request.
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                                Object handler, Exception ex) {
        /**
         * Called after the request is fully completed (view rendered / response committed).
         *
         * This method:
         * <ul>
         *   <li>Reads the start time set in {@link #preHandle}.</li>
         *   <li>Computes duration and logs with an appropriate severity.</li>
         *   <li>Records metrics via {@link MetricsService#recordRequest(long, int)}.</li>
         * </ul>
         */
        Long startTime = (Long) request.getAttribute("startTime");
        if (startTime == null) return;
        
        long duration = System.currentTimeMillis() - startTime;
        int status = response.getStatus();
        String method = request.getMethod();
        String uri = request.getRequestURI();

        // Log with appropriate level based on status code and latency.
        if (status >= 500) {
            logger.error("{} {} | {}ms | {} SERVER ERROR", method, uri, duration, status);
        } else if (status >= 400) {
            logger.warn("{} {} | {}ms | {} CLIENT ERROR", method, uri, duration, status);
        } else if (duration > 1000) {
            logger.warn("{} {} | {}ms | {} SLOW REQUEST", method, uri, duration, status);
        } else {
            logger.info("{} {} | {}ms | {}", method, uri, duration, status);
        }

        // If there was an exception, log it separately for stack traces.
        if (ex != null) {
            logger.error("Request failed with exception: ", ex);
        }

        // Update in-memory metrics.
        MetricsService.recordRequest(duration, status);
    }
}
