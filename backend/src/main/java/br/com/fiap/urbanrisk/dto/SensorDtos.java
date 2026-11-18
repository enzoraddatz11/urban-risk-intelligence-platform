package br.com.fiap.urbanrisk.dto;
import br.com.fiap.urbanrisk.entities.*;
import jakarta.validation.constraints.*;
public final class SensorDtos {
    private SensorDtos() {}
    public record Request(
            @NotBlank @Size(max=100) String name,
            @NotNull SensorType type,
            @NotBlank @Size(max=30) String unit,
            @NotNull SensorStatus status,
            @NotNull @Positive Long regionId,
            @NotNull DataSource source,
            @NotNull @Min(0) @Max(100) Integer confidence) {}
    public record Response(Long id, String name, SensorType type, String unit, SensorStatus status, Long regionId,
            DataSource source, Integer confidence, ConfidenceLevel confidenceLevel) {
        public static Response from(UrbanSensor e) {
            return new Response(e.id, e.name, e.type, e.unit, e.status, e.region.getId(), e.source, e.confidence, ConfidenceLevel.of(e.confidence));
        }
    }
}
