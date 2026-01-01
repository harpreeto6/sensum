package com.sensum.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
/**
 * Minimal liveness endpoint.
 *
 * <p>This is typically used by local dev tooling, container orchestrators, or uptime checks to
 * determine whether the process is responsive.
 */
public class HealthController {

    /**
     * Returns a simple "ok" string when the service is reachable.
     */
    @GetMapping("/health")
    public String health() {
        return "ok";
    }
}