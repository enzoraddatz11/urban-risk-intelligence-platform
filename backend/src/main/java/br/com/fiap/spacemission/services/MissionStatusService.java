package br.com.fiap.spacemission.services;
import br.com.fiap.spacemission.dto.MissionStatusResponse;
import br.com.fiap.spacemission.entities.*;
import br.com.fiap.spacemission.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
@Service
@Transactional(readOnly=true)
public class MissionStatusService {
    private final ComputingModuleRepository modules;
    private final SensorRepository sensors;
    private final MonitoredSystemRepository systems;
    private final SensorReadingRepository readings;
    private final OperationalEventRepository events;
    private final CriticalAlertRepository alerts;
    public MissionStatusService(ComputingModuleRepository modules, SensorRepository sensors, MonitoredSystemRepository systems,
            SensorReadingRepository readings, OperationalEventRepository events, CriticalAlertRepository alerts) {
        this.modules=modules; this.sensors=sensors; this.systems=systems; this.readings=readings; this.events=events; this.alerts=alerts;
    }
    public MissionStatusResponse get() {
        long active = alerts.countByStatus(AlertStatus.ACTIVE);
        long offline = count(HealthStatus.OFFLINE), degraded = count(HealthStatus.DEGRADED);
        long m=modules.count(), s=sensors.count(), y=systems.count();
        String status = active > 0 || offline > 0 ? "CRITICAL" : degraded > 0 ? "WARNING" : m+s+y == 0 ? "UNKNOWN" : "NOMINAL";
        return new MissionStatusResponse(status, Instant.now(), m, s, y, readings.count(), events.count(), active, degraded, offline);
    }
    private long count(HealthStatus status) {
        return modules.countByStatus(status)+sensors.countByStatus(status)+systems.countByStatus(status);
    }
}
