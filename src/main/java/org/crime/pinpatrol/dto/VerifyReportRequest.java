package org.crime.pinpatrol.dto;

import jakarta.validation.constraints.NotNull;
import org.crime.pinpatrol.model.Report;

public record VerifyReportRequest(
        @NotNull Report.VerificationStatus verificationStatus
) {
}
