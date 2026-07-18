package org.crime.pinpatrol.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.crime.pinpatrol.model.Report;

public record CreateReportRequest(
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
        Double lat,

        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
        Double lng,

        @NotBlank
        String category,

        @NotNull
        Report.Severity severity,

        @NotBlank
        @Size(min = 10, max = 500, message = "Description must be between 10 and 500 characters")
        String description
) {
}
