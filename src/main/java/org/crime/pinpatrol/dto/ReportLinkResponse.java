package org.crime.pinpatrol.dto;

import org.crime.pinpatrol.model.ReportLink;

import java.time.LocalDateTime;

public record ReportLinkResponse(
        Long id,
        Long relatedReportId,
        String linkType,
        String aiReason,
        LocalDateTime createdAt
) {

    public static ReportLinkResponse from(ReportLink link, Long viewedFromReportId) {
        Long otherId = link.getReport().getId().equals(viewedFromReportId)
                ? link.getRelatedReport().getId()
                : link.getReport().getId();

        return new ReportLinkResponse(
                link.getId(),
                otherId,
                link.getLinkType().name(),
                link.getAiReason(),
                link.getCreatedAt()
        );
    }
}