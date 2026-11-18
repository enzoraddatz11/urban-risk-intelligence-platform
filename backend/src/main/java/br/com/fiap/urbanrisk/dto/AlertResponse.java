package br.com.fiap.urbanrisk.dto;
import br.com.fiap.urbanrisk.analysis.AlertPriorityCalculator.Factors;
import br.com.fiap.urbanrisk.entities.*;
import java.time.Instant;
/** Alerta priorizado, derivado de um evento de risco ativo. */
public record AlertResponse(Long eventId, String title, String description, RiskType riskType, Severity severity,
        Long regionId, String regionName, DataSource source, Integer confidence, ConfidenceLevel confidenceLevel,
        long communityReports, Instant lastReadingAt, Instant occurredAt, int score, Severity priority, Factors factors) {}
