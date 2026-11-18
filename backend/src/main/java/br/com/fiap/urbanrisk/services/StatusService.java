package br.com.fiap.urbanrisk.services;
import br.com.fiap.urbanrisk.dto.*;
import br.com.fiap.urbanrisk.entities.*;
import br.com.fiap.urbanrisk.repositories.*;
import java.time.Clock;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@Transactional(readOnly=true)
public class StatusService {
    private final RegionRepository regions;
    private final UrbanSensorRepository sensors;
    private final SensorReadingRepository readings;
    private final RiskEventRepository events;
    private final CommunityReportRepository reports;
    private final AlertService alerts;
    private final Clock clock;
    public StatusService(RegionRepository regions, UrbanSensorRepository sensors, SensorReadingRepository readings,
            RiskEventRepository events, CommunityReportRepository reports, AlertService alerts, Clock clock) {
        this.regions = regions; this.sensors = sensors; this.readings = readings; this.events = events;
        this.reports = reports; this.alerts = alerts; this.clock = clock;
    }
    public StatusResponse get() {
        var prioritized = alerts.prioritized(null, Integer.MAX_VALUE);
        long critical = prioritized.stream().filter(a -> a.priority() == Severity.CRITICA).count();
        long high = prioritized.stream().filter(a -> a.priority() == Severity.ALTA).count();
        long offline = sensors.countByStatus(SensorStatus.OFFLINE), unstable = sensors.countByStatus(SensorStatus.INSTAVEL);
        long regionCount = regions.count(), active = prioritized.size();
        String status = regionCount == 0 ? "SEM_DADOS" : critical > 0 ? "CRITICO"
                : active > 0 || offline > 0 || unstable > 0 ? "ATENCAO" : "NORMAL";
        return new StatusResponse(status, clock.instant(), regionCount, sensors.count(), readings.count(), events.count(),
                active, reports.count(), offline, unstable, critical, high);
    }
}
