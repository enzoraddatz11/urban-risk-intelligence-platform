package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
import jakarta.validation.constraints.*;
public record SensorReadingRequest(
        @NotNull @Digits(integer=12, fraction=6) java.math.BigDecimal value,
        @NotNull @PastOrPresent java.time.Instant recordedAt,
        @NotNull @Positive Long sensorId) {}
