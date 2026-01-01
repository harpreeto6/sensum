package com.sensum.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
/**
 * Adds a request id to each HTTP request/response and stores it in the logging MDC.
 *
 * <p>This enables log correlation: every log statement written while handling a request can
 * include the same request id (depending on the log pattern).
 */
public class RequestIdFilter extends OncePerRequestFilter {

    /**
     * Header used to propagate request ids across services.
     */
    public static final String HEADER = "X-Request-Id";

    @Override
    /**
     * Ensures an {@code X-Request-Id} exists, echoes it on the response, and sets MDC.
     */
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String rid = request.getHeader(HEADER);
        if (rid == null || rid.isBlank()) {
            rid = "req-" + UUID.randomUUID();
        }

        MDC.put("requestId", rid);
        response.setHeader(HEADER, rid);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("requestId");
        }
    }
}