package org.crime.pinpatrol.dto;

public record SignatureResponse(
        long timestamp,
        String signature,
        String apiKey,
        String cloudName,
        String folder
) {
}
