package com.sensum.backend.events;

import tools.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
    public EventIngestResponse ingest(@RequestBody JsonNode body) {
        List<Event> batch = new ArrayList<>();

        if (body.isArray()) {
            for (JsonNode node : body) {
                batch.add(parseEvent(node));
            }
        } else {
            batch.add(parseEvent(body));
        }

        events.saveAll(batch);
        return new EventIngestResponse(batch.size());
    }

    private static Event parseEvent(JsonNode node) {
        Event e = new Event();

        // Optional
        if (node.hasNonNull("userId")) e.setUserId(node.get("userId").asLong());

        e.setDomain(node.get("domain").asText());
        e.setDurationSec(node.get("durationSec").asInt());
        e.setEventType(node.get("eventType").asText());

        // Optional: if missing, default to now
        if (node.hasNonNull("ts")) {
            e.setTs(Instant.parse(node.get("ts").asText()));
        } else {
            e.setTs(Instant.now());
        }

        return e;
    }
}