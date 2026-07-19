package org.crime.pinpatrol.dto;

import jakarta.validation.constraints.NotNull;
import org.crime.pinpatrol.model.Report;

public record UpdateStatusRequest(
        @NotNull Report.Status status
) {
}
