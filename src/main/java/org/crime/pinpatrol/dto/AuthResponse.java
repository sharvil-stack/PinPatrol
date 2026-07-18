package org.crime.pinpatrol.dto;

public record AuthResponse(
        Long id,
        String email,
        String role
) {

}
