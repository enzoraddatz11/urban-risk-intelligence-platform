package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
public record MonitoredSystemResponse(Long id, String name, String description, HealthStatus status, Long moduleId) {
    public static MonitoredSystemResponse from(MonitoredSystem entity) {
        return new MonitoredSystemResponse(entity.id, entity.name, entity.description, entity.status, entity.module.getId());
    }
}
