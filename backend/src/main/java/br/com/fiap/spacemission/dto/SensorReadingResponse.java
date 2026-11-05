package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
public record SensorReadingResponse(Long id, java.math.BigDecimal value, java.time.Instant recordedAt, Long sensorId) {
    public static SensorReadingResponse from(SensorReading entity) {
        return new SensorReadingResponse(entity.id, entity.value, entity.recordedAt, entity.sensor.getId());
    }
}
