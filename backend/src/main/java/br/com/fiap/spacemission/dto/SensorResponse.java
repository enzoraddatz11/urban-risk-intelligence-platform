package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
public record SensorResponse(Long id, String name, String type, String unit, HealthStatus status, Long moduleId) {
    public static SensorResponse from(Sensor entity) {
        return new SensorResponse(entity.id, entity.name, entity.type, entity.unit, entity.status, entity.module.getId());
    }
}
