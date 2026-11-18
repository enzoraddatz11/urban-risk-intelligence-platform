package br.com.fiap.urbanrisk.dto;
import br.com.fiap.urbanrisk.entities.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
public final class EventDtos {
    private EventDtos() {}
    public record Request(
            @NotBlank @Size(max=100) String title,
            @NotBlank @Size(max=500) String description,
            @NotNull RiskType type,
            @NotNull Severity severity,
            @NotNull EventStatus status,
            @NotNull @PastOrPresent Instant occurredAt,
            @NotNull @Positive Long regionId,
            @NotNull DataSource source,
            @NotNull @Min(0) @Max(100) Integer confidence) {}
    public record Response(Long id, String title, String description, RiskType type, Severity severity, EventStatus status,
            Instant occurredAt, Long regionId, DataSource source, Integer confidence, ConfidenceLevel confidenceLevel) {
        public static Response from(RiskEvent e) {
            return new Response(e.id, e.title, e.description, e.type, e.severity, e.status, e.occurredAt, e.region.getId(),
                    e.source, e.confidence, ConfidenceLevel.of(e.confidence));
        }
    }
}
