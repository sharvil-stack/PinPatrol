package org.crime.pinpatrol.dto;

import java.util.Map;

public record DashboardStatsResponse(
        long open,
        long investigating,
        long resolved,
        long highSeverity,
        Map<String, Long> byCategory
) {
}
