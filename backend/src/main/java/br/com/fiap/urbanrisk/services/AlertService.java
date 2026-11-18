package br.com.fiap.urbanrisk.services;
import br.com.fiap.urbanrisk.analysis.AlertPriorityCalculator;
import br.com.fiap.urbanrisk.dto.AlertResponse;
import br.com.fiap.urbanrisk.entities.*;
import br.com.fiap.urbanrisk.exceptions.ResourceNotFoundException;
import br.com.fiap.urbanrisk.repositories.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gera os alertas priorizados a partir dos eventos de risco ativos. */
@Service
@Transactional(readOnly=true)
public class AlertService {
    static final Comparator<AlertResponse> PRIORITY_ORDER = Comparator.comparingInt(AlertResponse::score).reversed()
            .thenComparing(Comparator.comparingInt((AlertResponse a) -> a.severity().points()).reversed())
            .thenComparing(AlertResponse::occurredAt, Comparator.reverseOrder())
            .thenComparing(AlertResponse::eventId, Comparator.reverseOrder());
    private final RiskEventRepository events;
    private final CommunityReportRepository reports;
    private final SensorReadingRepository readings;
    private final RegionRepository regions;
    private final Clock clock;
    public AlertService(RiskEventRepository events, CommunityReportRepository reports, SensorReadingRepository readings,
            RegionRepository regions, Clock clock) {
        this.events = events; this.reports = reports; this.readings = readings; this.regions = regions; this.clock = clock;
    }

    public List<AlertResponse> prioritized(Long regionId, int limit) {
        if (regionId != null && !regions.existsById(regionId)) throw new ResourceNotFoundException("Região", regionId);
        Instant now = clock.instant();
        Map<String, Long> reportCounts = new HashMap<>();
        for (Object[] row : reports.countByRegionAndTypeSince(now.minus(AlertPriorityCalculator.REPORT_WINDOW))) {
            reportCounts.put(key(row[0], row[1]), (Long) row[2]);
        }
        Map<String, Instant> latestReadings = new HashMap<>();
        for (Object[] row : readings.latestByRegionAndSensorType()) latestReadings.put(key(row[0], row[1]), (Instant) row[2]);

        return events.findByStatus(EventStatus.ATIVO).stream()
                .filter(event -> regionId == null || regionId.equals(event.region.getId()))
                .map(event -> toAlert(event, now, reportCounts, latestReadings))
                .sorted(PRIORITY_ORDER).limit(limit).toList();
    }

    private AlertResponse toAlert(RiskEvent event, Instant now, Map<String, Long> reportCounts, Map<String, Instant> latestReadings) {
        Long region = event.region.getId();
        long communityReports = reportCounts.getOrDefault(key(region, event.type), 0L);
        Instant lastReading = event.type.relatedSensors().stream().map(type -> latestReadings.get(key(region, type)))
                .filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
        var result = AlertPriorityCalculator.calculate(new AlertPriorityCalculator.Input(
                event.severity, event.source, event.confidence, communityReports, lastReading, now));
        return new AlertResponse(event.id, event.title, event.description, event.type, event.severity, region, event.region.name,
                event.source, event.confidence, ConfidenceLevel.of(event.confidence), communityReports, lastReading,
                event.occurredAt, result.score(), result.priority(), result.factors());
    }

    private static String key(Object region, Object type) { return region + ":" + type; }
}
