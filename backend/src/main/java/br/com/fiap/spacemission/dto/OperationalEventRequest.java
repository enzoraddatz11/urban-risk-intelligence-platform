package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
import jakarta.validation.constraints.*;
public record OperationalEventRequest(
        @NotBlank @Size(max=100) String title,
        @NotBlank @Size(max=500) String description,
        @NotNull Severity severity,
        @NotNull @PastOrPresent java.time.Instant occurredAt,
        @NotNull @Positive Long systemId) {}
