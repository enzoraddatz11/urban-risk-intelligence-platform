package br.com.fiap.spacemission.config;
import br.com.fiap.spacemission.entities.*;
import br.com.fiap.spacemission.repositories.*;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
@Component
@ConditionalOnProperty(name="app.seed-enabled", havingValue="true")
public class SeedData implements ApplicationRunner {
    private final ComputingModuleRepository modules;
    private final SensorRepository sensors;
    private final MonitoredSystemRepository systems;
    private final SensorReadingRepository readings;
    private final OperationalEventRepository events;
    private final CriticalAlertRepository alerts;
    public SeedData(ComputingModuleRepository modules, SensorRepository sensors, MonitoredSystemRepository systems,
            SensorReadingRepository readings, OperationalEventRepository events, CriticalAlertRepository alerts) {
        this.modules=modules; this.sensors=sensors; this.systems=systems; this.readings=readings; this.events=events; this.alerts=alerts;
    }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        // Inicializa apenas um banco completamente vazio; a transação evita carga parcial.
        if (modules.count()+sensors.count()+systems.count()+readings.count()+events.count()+alerts.count() != 0) return;
        ComputingModule module = new ComputingModule();
        module.name="Computador de bordo"; module.description="Controle principal da missão"; module.status=HealthStatus.OPERATIONAL;
        modules.save(module);
        Sensor sensor = new Sensor();
        sensor.name="Temperatura da cabine"; sensor.type="TEMPERATURE"; sensor.unit="°C"; sensor.status=HealthStatus.OPERATIONAL; sensor.module=module;
        sensors.save(sensor);
        MonitoredSystem system = new MonitoredSystem();
        system.name="Suporte à vida"; system.description="Monitoramento ambiental"; system.status=HealthStatus.DEGRADED; system.module=module;
        systems.save(system);
        SensorReading reading = new SensorReading();
        reading.sensor=sensor; reading.value=new BigDecimal("24.5"); reading.recordedAt=Instant.now(); readings.save(reading);
        OperationalEvent event = new OperationalEvent();
        event.system=system; event.title="Telemetria recebida"; event.description="Primeiro pacote de exemplo";
        event.severity=Severity.INFO; event.occurredAt=Instant.now(); events.save(event);
        CriticalAlert alert = new CriticalAlert();
        alert.system=system; alert.title="Verificar suporte à vida"; alert.description="Alerta de demonstração para teste do painel";
        alert.status=AlertStatus.ACTIVE; alert.occurredAt=Instant.now(); alerts.save(alert);
    }
}
