package org.crime.pinpatrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.crime.pinpatrol.model.ReportMedia;

public record AddMediaRequest(
        @NotBlank String url,
        @NotNull ReportMedia.MediaType type
) {
}
