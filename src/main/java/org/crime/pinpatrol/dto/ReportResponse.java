package org.crime.pinpatrol.dto;

import org.crime.pinpatrol.model.Report;

import java.time.LocalDateTime;
import java.util.List;

public record ReportResponse(
        Long id,
        Double lat,
        Double lng,
        String category,
        String severity,
        String description,
        String status,
        String verificationStatus,
        Long reporterId,
        String aiCaseBrief,
        LocalDateTime createdAt,
        LocalDateTime verifiedAt,
        List<MediaResponse> media
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getLat(),
                report.getLng(),
                report.getCategory(),
                report.getSeverity().name(),
                report.getDescription(),
                report.getStatus().name(),
                report.getVerificationStatus().name(),
                report.getReporter() != null ? report.getReporter().getId() : null,
                report.getAiCaseBrief(),
                report.getCreatedAt(),
                report.getVerifiedAt(),
                report.getMedia().stream().map(MediaResponse::from).toList()
        );
    }
}
