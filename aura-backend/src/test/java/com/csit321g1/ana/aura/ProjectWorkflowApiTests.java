package com.csit321g1.ana.aura;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** End-to-end walk through the must-have requirements over HTTP, on an in-memory H2 database. */
@SpringBootTest
class ProjectWorkflowApiTests {

    @Autowired
    WebApplicationContext context;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    private String json(MockHttpServletRequestBuilder req, Long userId, String body, int expected) throws Exception {
        if (userId != null) {
            req.header("X-User-Id", userId);
        }
        if (body != null) {
            req.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(req).andExpect(status().is(expected)).andReturn().getResponse().getContentAsString();
    }

    private long register(String name, String email) throws Exception {
        String body = String.format(
                "{\"fullName\":\"%s\",\"studentId\":\"%s\",\"email\":\"%s\",\"course\":\"BSIT\",\"password\":\"pw12345\"}",
                name, "ID-" + email, email);
        String res = json(post("/api/auth/register"), null, body, 200);
        return ((Number) JsonPath.read(res, "$.id")).longValue();
    }

    private long id(String response) {
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    @Test
    void feedbackToRevisionWorkflow() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        long ana = register("Ana Reyes", "ana" + suffix + "@school.edu.ph");
        long ken = register("Ken Tan", "ken" + suffix + "@school.edu.ph");
        long eve = register("Eve Outsider", "eve" + suffix + "@school.edu.ph");
        LocalDate today = LocalDate.now();

        // Requirement 1: project + components with deadline and status
        String project = json(post("/api/projects"), ana,
                "{\"title\":\"Shuttle Tracker\",\"adviser\":\"Dr. Santos\"}", 201);
        long p = id(project);
        json(post("/api/projects/" + p + "/members"), ana, "{\"email\":\"ken" + suffix + "@school.edu.ph\"}", 201);
        json(get("/api/projects/" + p), eve, null, 404); // outsiders cannot see it
        json(get("/api/projects/" + p), ken, null, 200); // group members can

        json(post("/api/projects/" + p + "/components"), ana, "{\"name\":\"No deadline\"}", 400);
        String comp = json(post("/api/projects/" + p + "/components"), ana,
                "{\"name\":\"Chapter 2\",\"type\":\"Chapter\",\"dueDate\":\"" + today.plusDays(5) + "\"}", 201);
        long c = id(comp);
        json(patch("/api/projects/" + p + "/components/" + c + "/status"), ana, "{\"status\":\"Under Review\"}", 200);

        // Requirements 2 and 3: feedback, linked task assigned to a member
        long f = id(json(post("/api/projects/" + p + "/feedback"), ana,
                "{\"componentId\":" + c + ",\"text\":\"Group studies by theme.\"}", 201));
        String members = json(get("/api/projects/" + p + "/members"), ana, null, 200);
        java.util.List<Number> kenIds = JsonPath.read(members, "$[?(@.name=='Ken Tan')].id");
        long kenMember = kenIds.get(0).longValue();
        long t = id(json(post("/api/projects/" + p + "/feedback/" + f + "/tasks"), ana,
                "{\"title\":\"Reorganize 2.3\",\"assigneeId\":" + kenMember + ",\"dueDate\":\"" + today.plusDays(3) + "\"}", 201));
        mvc.perform(get("/api/projects/" + p + "/tasks?mine=true").header("X-User-Id", ken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        json(patch("/api/projects/" + p + "/tasks/" + t + "/status"), ken, "{\"status\":\"Done\"}", 200);

        // Requirement 2: the instructor changes their mind, the earlier feedback is preserved
        json(post("/api/projects/" + p + "/feedback/" + f + "/revise"), ana,
                "{\"text\":\"Group by theme and state the research gap.\",\"reason\":\"Emailed update\"}", 201);
        mvc.perform(get("/api/projects/" + p + "/feedback?includeSuperseded=true").header("X-User-Id", ana))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/projects/" + p + "/feedback").header("X-User-Id", ana))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));

        // Requirement 4: document the change; history keeps everything
        json(post("/api/projects/" + p + "/revisions"), ken,
                "{\"feedbackId\":" + f + ",\"summary\":\"Reorganized section 2.3\"}", 201);
        mvc.perform(get("/api/projects/" + p + "/history?type=Revision").header("X-User-Id", ana))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));

        // Requirement 5: overview
        mvc.perform(get("/api/projects/" + p + "/overview").header("X-User-Id", ana))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalComponents").value(1))
                .andExpect(jsonPath("$.componentStatusCounts['Under Review']").value(1))
                .andExpect(jsonPath("$.unresolvedFeedback.length()").value(1))
                .andExpect(jsonPath("$.outstandingTasks.length()").value(0));

        // Deleting archives; history survives
        json(delete("/api/projects/" + p + "/components/" + c), ana, null, 200);
        json(get("/api/projects/" + p + "/components/" + c), ana, null, 404);
        mvc.perform(get("/api/projects/" + p + "/history").header("X-User-Id", ana))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThan(5)));

        json(delete("/api/projects/" + p), ken, null, 403);
        json(delete("/api/projects/" + p), ana, null, 200);
        json(get("/api/projects"), null, null, 401);
    }
}
