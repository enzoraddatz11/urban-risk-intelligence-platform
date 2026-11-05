package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
public record CriticalAlertResponse(Long id, String title, String description, AlertStatus status, java.time.Instant occurredAt, Long systemId) {
    public static CriticalAlertResponse from(CriticalAlert entity) {
        return new CriticalAlertResponse(entity.id, entity.title, entity.description, entity.status, entity.occurredAt, entity.system.getId());
    }
}
