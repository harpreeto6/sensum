package com.sensum.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
/**
 * Centralized exception-to-response mapping for the API.
 *
 * <p>The frontend expects JSON responses with a simple shape:
 * <ul>
 *   <li>{@code error}: machine-readable code</li>
 *   <li>{@code message}: human-readable description</li>
 *   <li>{@code path}: request path for debugging</li>
 * </ul>
 *
 * <p>This handler intentionally avoids returning stack traces or internal details to clients.
 */
public class ApiExceptionHandler {

    /**
     * Maps validation and domain-level argument issues to HTTP 400.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException ex, HttpServletRequest req) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", "bad_request",
                "message", ex.getMessage(),
                "path", req.getRequestURI()
        ));
    }

    /**
     * Maps malformed or missing JSON bodies to HTTP 400.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleBadJson(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", "bad_request",
                "message", "Invalid or missing JSON body",
                "path", req.getRequestURI()
        ));
    }

    /**
     * Catch-all mapping to HTTP 500.
     *
     * <p>Intentionally returns a generic message to avoid leaking internal details.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex, HttpServletRequest req) {
        // Keep it simple for now; don’t leak stack traces to client
        return ResponseEntity.status(500).body(Map.of(
                "error", "internal_error",
                "message", "Something went wrong",
                "path", req.getRequestURI()
        ));
    }
}