package com.sensum.backend.observability;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-memory metrics registry for the backend.
 *
 * <h2>What it measures</h2>
 * <ul>
 *   <li>Total request count and a basic breakdown (2xx, 4xx, 5xx).</li>
 *   <li>Total response time, used to compute an average.</li>
 *   <li>Slow request count (requests taking more than 1000ms).</li>
 *   <li>Application uptime since JVM start (not container start if JVM is restarted).</li>
 * </ul>
 *
 * <h2>Thread-safety</h2>
 * Metrics are updated from many request threads. We use {@link AtomicLong} for safe concurrent updates.
 *
 * <h2>Design choice</h2>
 * This class intentionally avoids external dependencies (Micrometer, Prometheus). It's meant to be a
 * simple, portfolio-friendly observability layer.
 */
@Service
public class MetricsService {

    private static final Instant startTime = Instant.now();
    private static final AtomicLong totalRequests = new AtomicLong(0);
    private static final AtomicLong successfulRequests = new AtomicLong(0);
    private static final AtomicLong clientErrors = new AtomicLong(0); // 4xx
    private static final AtomicLong serverErrors = new AtomicLong(0); // 5xx
    private static final AtomicLong totalResponseTimeMs = new AtomicLong(0);
    private static final AtomicLong slowRequestCount = new AtomicLong(0); // > 1 second

    /**
     * Records a completed HTTP request.
     *
     * @param durationMs how long the request took in milliseconds
     * @param statusCode HTTP response status code
     */
    public static void recordRequest(long durationMs, int statusCode) {
        totalRequests.incrementAndGet();
        totalResponseTimeMs.addAndGet(durationMs);

        if (statusCode >= 200 && statusCode < 300) {
            successfulRequests.incrementAndGet();
        } else if (statusCode >= 400 && statusCode < 500) {
            clientErrors.incrementAndGet();
        } else if (statusCode >= 500) {
            serverErrors.incrementAndGet();
        }

        if (durationMs > 1000) {
            slowRequestCount.incrementAndGet();
        }
    }

    /**
     * @return total number of HTTP requests recorded since the process started
     */
    public long getTotalRequests() {
        return totalRequests.get();
    }

    /**
     * @return number of successful HTTP requests (status 2xx)
     */
    public long getSuccessfulRequests() {
        return successfulRequests.get();
    }

    /**
     * @return number of client error requests (status 4xx)
     */
    public long getClientErrors() {
        return clientErrors.get();
    }

    /**
     * @return number of server error requests (status 5xx)
     */
    public long getServerErrors() {
        return serverErrors.get();
    }

    /**
     * "Slow" is defined as taking longer than 1000ms.
     *
     * @return number of requests exceeding the slow threshold
     */
    public long getSlowRequestCount() {
        return slowRequestCount.get();
    }

    /**
     * Average duration is computed as {@code totalResponseTimeMs / totalRequests}.
     *
     * @return average response time in milliseconds (0.0 if there are no requests)
     */
    public double getAverageResponseTimeMs() {
        long total = totalRequests.get();
        if (total == 0) return 0.0;
        return (double) totalResponseTimeMs.get() / total;
    }

    /**
     * Success rate is computed as {@code successfulRequests / totalRequests * 100}.
     *
     * @return percentage of requests that are successful (100.0 if there are no requests yet)
     */
    public double getSuccessRate() {
        long total = totalRequests.get();
        if (total == 0) return 100.0;
        return (double) successfulRequests.get() / total * 100.0;
    }

    /**
     * Error rate is computed as {@code (clientErrors + serverErrors) / totalRequests * 100}.
     *
     * @return percentage of requests that resulted in 4xx/5xx (0.0 if there are no requests)
     */
    public double getErrorRate() {
        long total = totalRequests.get();
        if (total == 0) return 0.0;
        return (double) (clientErrors.get() + serverErrors.get()) / total * 100.0;
    }

    /**
     * Formats uptime into a human-readable string.
     *
     * @return uptime string like "12 minutes", "3 hours 10 minutes", or "2 days 5 hours"
     */
    public String getUptime() {
        Duration uptime = Duration.between(startTime, Instant.now());
        long days = uptime.toDays();
        long hours = uptime.toHoursPart();
        long minutes = uptime.toMinutesPart();
        
        if (days > 0) {
            return String.format("%d days %d hours", days, hours);
        } else if (hours > 0) {
            return String.format("%d hours %d minutes", hours, minutes);
        } else {
            return String.format("%d minutes", minutes);
        }
    }

    /**
     * @return the {@link Instant} when the MetricsService was initialized (approx. application start time)
     */
    public Instant getStartTime() {
        return startTime;
    }
}
