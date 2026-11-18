package br.com.fiap.urbanrisk.dto;
import br.com.fiap.urbanrisk.entities.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
public final class ReadingDtos {
    private ReadingDtos() {}
    public record Request(
            @NotNull @Digits(integer=12, fraction=6) BigDecimal value,
            @NotNull @PastOrPresent Instant recordedAt,
            @NotNull @Positive Long sensorId,
            @NotNull DataSource source,
            @NotNull @Min(0) @Max(100) Integer confidence) {}
    public record Response(Long id, BigDecimal value, Instant recordedAt, Long sensorId,
            DataSource source, Integer confidence, ConfidenceLevel confidenceLevel) {
        public static Response from(SensorReading e) {
            return new Response(e.id, e.value, e.recordedAt, e.sensor.getId(), e.source, e.confidence, ConfidenceLevel.of(e.confidence));
        }
    }
}
