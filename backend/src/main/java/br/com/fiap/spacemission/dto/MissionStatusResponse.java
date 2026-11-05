package br.com.fiap.spacemission.dto;
import java.time.Instant;
public record MissionStatusResponse(String status, Instant checkedAt, long modules, long sensors,
        long systems, long readings, long events, long activeCriticalAlerts, long degradedComponents, long offlineComponents) {}
