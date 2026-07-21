package org.crime.pinpatrol.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;


@Service
public class VisionService {

    private final WebClient client;
    private final WebClient downloadClient;

    private final String apiKey;
    private final String model;

    public VisionService(
            @Value("${openrouter.api-key}") String apiKey,
            @Value("${openrouter.model}") String model
    ) {

        this.apiKey = apiKey;
        this.model = model;

        this.client = WebClient.builder()
                .baseUrl("https://openrouter.ai/api/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader("HTTP-Referer", "http://localhost:8080")
                .defaultHeader("X-Title", "PinPatrol")
                .build();

        this.downloadClient = WebClient.builder()
                .codecs(c ->
                        c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    public String describeImage(String imageUrl) {

        byte[] imageBytes = downloadClient.get()
                .uri(imageUrl)
                .retrieve()
                .bodyToMono(byte[].class)
                .block();

        if (imageBytes == null) {
            return "Could not download image.";
        }

        String mimeType = guessMimeType(imageUrl);

        String imageData =
                "data:" +
                        mimeType +
                        ";base64," +
                        Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> body = Map.of(

                "model", model,

                "messages", List.of(

                        Map.of(

                                "role", "user",

                                "content", List.of(

                                        Map.of(
                                                "type", "text",
                                                "text",
                                                "Describe only what is visibly present in this image in one or two short factual sentences for a police officer reviewing an incident report. Do not speculate. Only describe visible objects, people, vehicles, roads, buildings, weather, colors and any readable text."
                                        ),

                                        Map.of(
                                                "type", "image_url",
                                                "image_url",
                                                Map.of(
                                                        "url", imageData
                                                )
                                        )
                                )
                        )
                )
        );

        Map<?, ?> response = client.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return extract(response);
    }

    private String guessMimeType(String url) {

        String lower = url.toLowerCase();

        if (lower.contains(".png"))
            return "image/png";

        if (lower.contains(".webp"))
            return "image/webp";

        if (lower.contains(".gif"))
            return "image/gif";

        return "image/jpeg";
    }

    @SuppressWarnings("unchecked")
    private String extract(Map<?, ?> response) {

        try {

            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) response.get("choices");

            if (choices == null || choices.isEmpty())
                return "No response from AI.";

            Map<String, Object> message =
                    (Map<String, Object>) choices.get(0).get("message");

            return (String) message.get("content");

        } catch (Exception e) {

            e.printStackTrace();
            return "AI description unavailable.";
        }

    }

}
