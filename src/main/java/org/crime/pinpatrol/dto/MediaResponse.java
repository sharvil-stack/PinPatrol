package org.crime.pinpatrol.dto;

import org.crime.pinpatrol.model.ReportMedia;

public record MediaResponse(
        Long id,
        String url,
        String type,
        String aiDescription
) {
    public static MediaResponse from(ReportMedia media) {
        return new MediaResponse(
                media.getId(),
                media.getUrl(),
                media.getType().name(),
                media.getAiDescription()
        );
    }
}
