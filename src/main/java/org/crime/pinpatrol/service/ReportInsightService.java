package org.crime.pinpatrol.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.crime.pinpatrol.model.Report;
import org.crime.pinpatrol.model.ReportLink;
import org.crime.pinpatrol.model.ReportMedia;
import org.crime.pinpatrol.util.GeoUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;


@Service
public class ReportInsightService {

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final int MAX_MATCHES = 5;

    private final WebClient client;
    private final String model;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ReportInsightService(
            @Value("${openrouter.api-key}") String apiKey,
            @Value("${openrouter.model}") String model
    ) {
        this.model = model;
        this.client = WebClient.builder()
                .baseUrl("https://openrouter.ai/api/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader("HTTP-Referer", "http://localhost:8080")
                .defaultHeader("X-Title", "PinPatrol")
                .build();
    }

    public record SimilarMatch(Long id, String reason) {}


    public List<SimilarMatch> findSimilar(Report target, List<Report> candidates) {

        if (candidates.isEmpty()) {
            return List.of();
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are helping a police officer spot patterns between crime/incident reports.\n\n");
        prompt.append("TARGET REPORT:\n");
        appendReportLine(prompt, target, null);

        prompt.append("\nCANDIDATE REPORTS:\n");
        for (Report c : candidates) {
            appendReportLine(prompt, c, target);
        }

        prompt.append("\nIdentify which candidate reports plausibly describe an incident related to the target ")
                .append("(e.g. matching suspect/vehicle description, same method, an escalating pattern in the same area) ")
                .append("rather than an unrelated, coincidental report. Do not include the target's own id.\n")
                .append("Respond with ONLY a JSON array and nothing else (no markdown fences, no commentary). ")
                .append("Each element must look like {\"id\": <candidate report id>, \"reason\": \"<reason, under 20 words>\"}. ")
                .append("Return [] if none are related.");

        String raw = chatComplete(prompt.toString());
        String json = stripCodeFence(raw);

        try {
            SimilarMatch[] matches = objectMapper.readValue(json, SimilarMatch[].class);
            Set<Long> validIds = candidates.stream().map(Report::getId).collect(Collectors.toSet());

            List<SimilarMatch> filtered = new ArrayList<>();
            for (SimilarMatch m : matches) {
                if (m.id() != null && validIds.contains(m.id())) {
                    filtered.add(m);
                }
                if (filtered.size() >= MAX_MATCHES) {
                    break;
                }
            }
            return filtered;
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }


    public String summarizeCase(Report report, List<ReportMedia> media, List<ReportLink> links) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Write a concise case brief (3-5 sentences, plain prose, no headers or bullet points) ")
                .append("for a police officer reviewing this incident report. ")
                .append("Stick strictly to the facts provided below; do not speculate beyond them.\n\n");

        prompt.append("Report #").append(report.getId()).append("\n");
        prompt.append("Category: ").append(report.getCategory()).append("\n");
        prompt.append("Severity: ").append(report.getSeverity()).append("\n");
        prompt.append("Status: ").append(report.getStatus())
                .append(" / Verification: ").append(report.getVerificationStatus()).append("\n");
        prompt.append("Location: ").append(report.getLat()).append(", ").append(report.getLng()).append("\n");
        prompt.append("Reported at: ")
                .append(report.getCreatedAt() != null ? report.getCreatedAt().format(TS) : "unknown").append("\n");
        prompt.append("Reporter description: ").append(blankIfNull(report.getDescription())).append("\n");

        List<ReportMedia> described = media.stream()
                .filter(m -> m.getAiDescription() != null && !m.getAiDescription().isBlank())
                .toList();
        if (!described.isEmpty()) {
            prompt.append("\nMedia analysis:\n");
            for (ReportMedia m : described) {
                prompt.append("- ").append(m.getType()).append(": ").append(m.getAiDescription()).append("\n");
            }
        }

        if (!links.isEmpty()) {
            prompt.append("\nLinked reports:\n");
            for (ReportLink link : links) {
                Report other = link.getReport().getId().equals(report.getId())
                        ? link.getRelatedReport() : link.getReport();
                prompt.append("- [").append(link.getLinkType()).append("] report #").append(other.getId())
                        .append(" (").append(other.getCategory()).append("): ")
                        .append(blankIfNull(link.getAiReason())).append("\n");
            }
        }

        String raw = chatComplete(prompt.toString());
        return raw == null || raw.isBlank() ? "AI summary unavailable." : raw.trim();
    }

    private void appendReportLine(StringBuilder sb, Report r, Report relativeTo) {
        sb.append("- id=").append(r.getId())
                .append(", category=").append(r.getCategory())
                .append(", severity=").append(r.getSeverity());

        if (relativeTo != null && r.getLat() != null && r.getLng() != null
                && relativeTo.getLat() != null && relativeTo.getLng() != null) {
            double meters = GeoUtils.distanceMeters(relativeTo.getLat(), relativeTo.getLng(), r.getLat(), r.getLng());
            sb.append(String.format(", ~%.0fm from target", meters));
        }
        if (r.getCreatedAt() != null) {
            sb.append(", reported ").append(r.getCreatedAt().format(TS));
        }
        sb.append(", description=\"").append(blankIfNull(r.getDescription())).append("\"\n");
    }

    private String blankIfNull(String s) {
        return (s == null || s.isBlank()) ? "(none provided)" : s;
    }

    @SuppressWarnings("unchecked")
    private String chatComplete(String userPrompt) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", userPrompt))
        );

        Map<?, ?> response = client.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        System.out.println(response);

        try {
            if (response == null) return null;
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) return null;

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private String stripCodeFence(String s) {
        if (s == null) return "[]";
        String t = s.trim();
        if (t.startsWith("```")) {
            t = t.replaceFirst("^```[a-zA-Z]*\\n", "");
            if (t.endsWith("```")) {
                t = t.substring(0, t.length() - 3);
            }
        }
        return t.trim();
    }
}