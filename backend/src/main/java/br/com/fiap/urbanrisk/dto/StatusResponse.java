package br.com.fiap.urbanrisk.dto;
import java.time.Instant;
/** Situação geral da cidade: CRITICO, ATENCAO, NORMAL ou SEM_DADOS. */
public record StatusResponse(String status, Instant checkedAt, long regions, long sensors, long readings, long events,
        long activeEvents, long reports, long offlineSensors, long unstableSensors, long criticalAlerts, long highAlerts) {}
