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
public class EventsController {

    private final EventRepository events;

    public EventsController(EventRepository events) {
        this.events = events;
    }

    public static class EventIngestResponse {
        public int inserted;
        public EventIngestResponse(int inserted) { this.inserted = inserted; }
    }

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