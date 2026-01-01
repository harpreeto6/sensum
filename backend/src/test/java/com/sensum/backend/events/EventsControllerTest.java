package com.sensum.backend.events;

import com.sensum.backend.SecurityConfig;
import com.sensum.backend.config.ApiExceptionHandler;
import com.sensum.backend.config.RequestIdFilter;
import com.sensum.backend.security.JwtAuthenticationFilter;
import com.sensum.backend.testutil.TestAuth;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EventsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ApiExceptionHandler.class, RequestIdFilter.class})
class EventsControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    EventRepository events;

    @Test
    void ingest_requiresAuth() throws Exception {
        mvc.perform(post("/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void ingest_invalidEventType_returns400() throws Exception {
        String body = "{\"domain\":\"example.com\",\"durationSec\":30,\"eventType\":\"nope\"}";

        mvc.perform(post("/events")
                        .cookie(TestAuth.authCookie(1L, "a@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("bad_request"));

        verify(events, never()).saveAll(ArgumentMatchers.anyList());
    }

    @Test
    void ingest_validEvent_returns200() throws Exception {
        when(events.saveAll(ArgumentMatchers.<List<Event>>any())).thenAnswer(inv -> inv.getArgument(0));

        String body = "{\"domain\":\"example.com\",\"durationSec\":30,\"eventType\":\"time_spent\"}";

        mvc.perform(post("/events")
                        .cookie(TestAuth.authCookie(1L, "a@example.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inserted").value(1));

        verify(events).saveAll(ArgumentMatchers.anyList());
    }
}
