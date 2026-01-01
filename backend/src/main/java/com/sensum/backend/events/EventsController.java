package com.sensum.backend.events;

import tools.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/events")
/**
 * Ingestion endpoint for client telemetry events.
 *
 * <p>The browser extension (and potentially the web app) posts interaction/usage events here.
 * Events are stored and later aggregated for stats dashboards and product analytics.
 *
 * <h2>Authentication</h2>
 * Requires an authenticated request (JWT cookie). The user id is taken from the request attribute
 * set by {@link com.sensum.backend.security.JwtAuthenticationFilter}; the payload is not trusted
 * for user identification.
 *
 * <h2>Request body</h2>
 * Accepts either a single JSON object or an array of objects. Each object supports:
 * <ul>
 *   <li>{@code domain} (required, max 255)</li>
 *   <li>{@code durationSec} (optional, 0..86400)</li>
 *   <li>{@code eventType} (required; currently one of: time_spent, nudge_shown, nudge_clicked, snooze, disable)</li>
 *   <li>{@code ts} (optional ISO-8601 instant; defaults to server time)</li>
 * </ul>
 *
 * <p>Validation failures are raised as {@link IllegalArgumentException} and returned as HTTP 400
 * by the global API exception handler.
 */
public class EventsController {

    private final EventRepository events;

    public EventsController(EventRepository events) {
        this.events = events;
    }

    public static class EventIngestResponse {
        public int inserted;
        public EventIngestResponse(int inserted) { this.inserted = inserted; }
    }

    /**
     * Ingests a single event or a batch of events.
     *
     * @return HTTP 200 with the number of inserted events; HTTP 401 if unauthenticated
     */
    @PostMapping
    public ResponseEntity<EventIngestResponse> ingest(@RequestBody JsonNode body, HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build(); // not authenticated
        }
    
        List<Event> batch = new ArrayList<>();
    
        if (body.isArray()) {
            for (JsonNode node : body) {
                batch.add(parseEvent(node, userId)); // pass userId here
            }
        } else {
            batch.add(parseEvent(body, userId));
        }
    
        events.saveAll(batch);
        return ResponseEntity.ok(new EventIngestResponse(batch.size()));
    }

    /**
     * Parses and validates a single event payload.
     *
     * <p>Always assigns {@code userId} from the authenticated request; never from the payload.
     */
    private static Event parseEvent(JsonNode node, Long userId) {

        String domain = node.hasNonNull("domain") ? node.get("domain").asText() : "";
        if (domain.isBlank() || domain.length() > 255) {
            throw new IllegalArgumentException("domain is required and must be <= 255 chars");
        }

        int duration = node.hasNonNull("durationSec") ? node.get("durationSec").asInt() : 0;
        if (duration < 0 || duration > 86400) {
            throw new IllegalArgumentException("durationSec must be between 0 and 86400");
        }

        String eventType = node.hasNonNull("eventType") ? node.get("eventType").asText() : "";
        var allowed = java.util.Set.of("time_spent", "nudge_shown", "nudge_clicked", "snooze", "disable");
        if (!allowed.contains(eventType)) {
            throw new IllegalArgumentException("Invalid eventType");
        }

        Instant ts;
        if (node.hasNonNull("ts")) {
            try {
                ts = Instant.parse(node.get("ts").asText());
            } catch (Exception ex) {
                throw new IllegalArgumentException("ts must be ISO-8601 (example: 2025-01-01T12:34:56Z)");
            }
        } else {
            ts = Instant.now();
        }

        Event e = new Event();
    
        // Always trust the authenticated userId, not the payload
        e.setUserId(userId);

        e.setDomain(domain);
        e.setDurationSec(duration);
        e.setEventType(eventType);
        e.setTs(ts);
    
        return e;
    }
}