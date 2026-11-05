package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
import jakarta.validation.constraints.*;
public record CriticalAlertRequest(
        @NotBlank @Size(max=100) String title,
        @NotBlank @Size(max=500) String description,
        @NotNull AlertStatus status,
        @NotNull @PastOrPresent java.time.Instant occurredAt,
        @NotNull @Positive Long systemId) {}
