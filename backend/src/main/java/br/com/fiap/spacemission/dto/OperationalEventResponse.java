package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
public record OperationalEventResponse(Long id, String title, String description, Severity severity, java.time.Instant occurredAt, Long systemId) {
    public static OperationalEventResponse from(OperationalEvent entity) {
        return new OperationalEventResponse(entity.id, entity.title, entity.description, entity.severity, entity.occurredAt, entity.system.getId());
    }
}
