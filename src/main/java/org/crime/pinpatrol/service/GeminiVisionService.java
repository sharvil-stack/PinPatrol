package org.crime.pinpatrol.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GeminiVisionService {

    private final WebClient geminiClient;
    private final WebClient downloadClient;
    private final String apiKey;
    private final String model;

    public GeminiVisionService(
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.model}") String model
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.geminiClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .build();
        this.downloadClient = WebClient.builder().build();
    }

    public String describeImage(String imageUrl) {
        byte[] imageBytes = downloadClient.get()
                .uri(imageUrl)
                .retrieve()
                .bodyToMono(byte[].class)
                .block();

        if (imageBytes == null) {
            return "Could not download image for analysis";
        }

        String base64 = Base64.getEncoder().encodeToString(imageBytes);
        String mimeType = guessMimeType(imageUrl);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(
                                Map.of("text", "Describe only what is visibly present in this image, "
                                        + "in one or two short factual sentences, for a police officer "
                                        + "reviewing an incident report. Do not speculate about what happened, "
                                        + "only describe what is visible."),
                                Map.of("inlineData", Map.of("mimeType", mimeType, "data", base64))
                        )
                ))
        );

        Map<?, ?> response = geminiClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/models/{model}:generateContent")
                        .queryParam("key", apiKey)
                        .build(model))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return extractText(response);
    }

    private String guessMimeType(String url) {
        String lower = url.toLowerCase();
        if (lower.contains(".png")) return "image/png";
        if (lower.contains(".webp")) return "image/webp";
        return "image/jpeg";
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<?, ?> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "AI description unavailable";
        }
    }
}
