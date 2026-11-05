package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
import jakarta.validation.constraints.*;
public record SensorRequest(
        @NotBlank @Size(max=100) String name,
        @NotBlank @Size(max=80) String type,
        @NotBlank @Size(max=30) String unit,
        @NotNull HealthStatus status,
        @NotNull @Positive Long moduleId) {}
