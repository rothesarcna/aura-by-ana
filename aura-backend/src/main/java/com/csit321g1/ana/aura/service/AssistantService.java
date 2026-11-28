package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.exception.BadRequestException;
import com.csit321g1.ana.aura.exception.NotFoundException;
import com.csit321g1.ana.aura.model.AiSuggestion;
import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.repository.AiSuggestionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class AssistantService {

    public record SuggestionResponse(Long id, String mode, String text, String status) {
    }

    private final RestClient http = RestClient.create("https://api.anthropic.com");

    @Value("${anthropic.api-key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-5-5}")
    private String model;

    private final AccessService access;
    private final SnapshotService snapshots;
    private final AiSuggestionRepository repo;

    public AssistantService(AccessService access, SnapshotService snapshots, AiSuggestionRepository repo) {
        this.access = access;
        this.snapshots = snapshots;
        this.repo = repo;
    }

    @SuppressWarnings("unchecked")
    public SuggestionResponse ask(Long userId, Long projectId, String mode) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        if (apiKey.isBlank()) {
            throw new BadRequestException("The AI assistant is not configured on this server.");
        }
        String task = switch (mode) {
            case "summarize" -> "Summarize the open instructor feedback in at most 5 short bullet points.";
            case "simplify" -> "Rewrite each open feedback comment in plain, simple language a student can act on.";
            case "patterns" -> "Identify recurring mistakes across the feedback records and name the components affected.";
            case "plan" -> "Break the open feedback into small revision actions. For each, suggest which group member "
                    + "should do it based on their responsibilities and current workload, and suggest one free learning "
                    + "resource topic to search for. End with one short, encouraging line based on the project's progress.";
            default -> throw new BadRequestException("Unknown assistant mode.");
        };

        ProjectSnapshot snap = snapshots.load(ctx.project());
        StringBuilder data = new StringBuilder("Overall progress: " + snap.overallProgress() + "%\n\nOPEN FEEDBACK:\n");
        snap.feedback().stream().filter(f -> f.getStatus() == FeedbackStatus.OPEN).forEach(f ->
                data.append("- ").append(f.getComponent_id().getName()).append(": ").append(f.getText()).append('\n'));
        data.append("\nTASKS:\n");
        snap.tasks().forEach(t -> data.append("- ").append(t.getTitle())
                .append(" [").append(t.getStatus().getLabel()).append("] ")
                .append(t.getAssignee_id() == null ? "unassigned" : t.getAssignee_id().getName()).append('\n'));
        data.append("\nMEMBERS:\n");
        snap.activeMembers().forEach(m -> data.append("- ").append(m.getName()).append(" (").append(m.getRole())
                .append("): ").append(m.getResponsibilities() == null ? "no responsibilities listed" : m.getResponsibilities().replace('\n', ';'))
                .append('\n'));

        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 1000,
                "system", "You help student research groups act on instructor feedback. Be concise and concrete. "
                        + "Use only the data given and never invent feedback.",
                "messages", List.of(Map.of("role", "user", "content", task + "\n\n" + data)));

        Map<String, Object> res = http.post().uri("/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {
                });
        String text = String.valueOf(((List<Map<String, Object>>) res.get("content")).get(0).get("text"));

        AiSuggestion s = new AiSuggestion();
        s.setProject(ctx.project());
        s.setCreatedBy(ctx.user());
        s.setMode(mode);
        s.setText(text);
        s = repo.save(s);
        return new SuggestionResponse(s.getId(), s.getMode(), s.getText(), s.getStatus());
    }

    /** Accept, edit or reject a suggestion. For an edit, send the new text too. */
    public SuggestionResponse review(Long userId, Long projectId, Long id, String status, String editedText) {
        access.require(projectId, userId);
        AiSuggestion s = repo.findById(id)
                .filter(x -> x.getProject().getId().equals(projectId))
                .orElseThrow(() -> new NotFoundException("Suggestion not found."));
        if (status == null || !Set.of("ACCEPTED", "EDITED", "REJECTED").contains(status)) {
            throw new BadRequestException("Status must be ACCEPTED, EDITED or REJECTED.");
        }
        if ("EDITED".equals(status) && editedText != null && !editedText.isBlank()) {
            s.setText(editedText.trim());
        }
        s.setStatus(status);
        return new SuggestionResponse(s.getId(), s.getMode(), s.getText(), s.getStatus());
    }
}