package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
import jakarta.validation.constraints.*;
public record MonitoredSystemRequest(
        @NotBlank @Size(max=100) String name,
        @NotBlank @Size(max=500) String description,
        @NotNull HealthStatus status,
        @NotNull @Positive Long moduleId) {}
