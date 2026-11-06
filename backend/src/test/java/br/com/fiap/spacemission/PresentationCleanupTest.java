package br.com.fiap.spacemission;

import br.com.fiap.spacemission.entities.*;
import br.com.fiap.spacemission.migration.PresentationCleanupService;
import br.com.fiap.spacemission.repositories.*;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:cleanup;DB_CLOSE_DELAY=-1", "app.seed-enabled=false", "app.presentation-cleanup.enabled=true"})
class PresentationCleanupTest {
    @Autowired PresentationCleanupService service;
    @Autowired ComputingModuleRepository modules;
    @Autowired SensorRepository sensors;
    @Autowired MonitoredSystemRepository systems;
    @Autowired SensorReadingRepository readings;
    @Autowired OperationalEventRepository events;
    @Autowired CriticalAlertRepository alerts;
    @Autowired ObjectMapper json;
    @Autowired PlatformTransactionManager transactionManager;
    ObjectNode baseline;
    ObjectNode manifest;

    @BeforeEach void prepare() {
        alerts.deleteAll(); events.deleteAll(); readings.deleteAll(); sensors.deleteAll(); systems.deleteAll(); modules.deleteAll();
        var module=new ComputingModule(); module.name="Módulo de validação"; module.description="Descrição anterior"; module.status=HealthStatus.OPERATIONAL; modules.saveAndFlush(module);
        var sensor=new Sensor(); sensor.name="Temperatura"; sensor.type="TEMPERATURE"; sensor.unit="C"; sensor.status=HealthStatus.OPERATIONAL; sensor.module=module; sensors.saveAndFlush(sensor);
        var system=new MonitoredSystem(); system.name="Ambiente externo"; system.description="Supervisão"; system.status=HealthStatus.DEGRADED; system.module=module; systems.saveAndFlush(system);
        Instant at=Instant.parse("2026-01-01T12:00:00.123456Z");
        var reading=new SensorReading(); reading.sensor=sensor; reading.value=new BigDecimal("-12.5"); reading.recordedAt=at; readings.saveAndFlush(reading);
        var event=new OperationalEvent(); event.title="Verificação"; event.description="Registro informativo"; event.severity=Severity.INFO; event.occurredAt=at; event.system=system; events.saveAndFlush(event);
        var alert=new CriticalAlert(); alert.title="Supervisão térmica"; alert.description="Descrição de validação"; alert.status=AlertStatus.RESOLVED; alert.occurredAt=at; alert.system=system; alerts.saveAndFlush(alert);
        baseline=service.snapshot();
        manifest=json.createObjectNode().put("scope",PresentationCleanupService.SCOPE);
        manifest.set("records",baseline.deepCopy());
        ArrayNode changes=manifest.putArray("changes");
        changes.addObject().put("resource","modules").put("id",module.id).putObject("after").put("name","Computador de Supervisão Térmica");
        changes.addObject().put("resource","alerts").put("id",alert.id).putObject("after").put("description","Ocorrência térmica resolvida.");
    }
    @Test void dryRunApplyAndRepeatPreserveEveryOtherField() {
        assertTrue(service.execute(manifest,false).dryRun());
        assertTrue(PresentationCleanupService.same(baseline,service.snapshot()));
        var applied=service.execute(manifest,true);
        assertEquals(2,applied.changedRecords()); assertEquals(4,applied.preservedRecords());
        ObjectNode expected=baseline.deepCopy();
        ((ObjectNode)expected.path("modules").get(0)).put("name","Computador de Supervisão Térmica");
        ((ObjectNode)expected.path("alerts").get(0)).put("description","Ocorrência térmica resolvida.");
        assertTrue(PresentationCleanupService.same(expected,service.snapshot()));
        var repeated=service.execute(manifest,true);
        assertEquals(0,repeated.changedRecords()); assertTrue(repeated.alreadyApplied());
        assertTrue(PresentationCleanupService.same(expected,service.snapshot()));
    }
    @Test void staleProtectedReadingAbortsEntireMigration() {
        ((ObjectNode)manifest.path("records").path("readings").get(0)).put("value",999);
        assertThrows(IllegalArgumentException.class,()->service.execute(manifest,true));
        assertTrue(PresentationCleanupService.same(baseline,service.snapshot()));
    }
    @Test void unknownIdAndNonTextualFieldAreRejectedWithoutAnyWrites() {
        ((ObjectNode)manifest.path("changes").get(1)).put("id",999999);
        assertThrows(IllegalArgumentException.class,()->service.execute(manifest,true));
        assertTrue(PresentationCleanupService.same(baseline,service.snapshot()));
        ((ObjectNode)manifest.path("changes").get(0).path("after")).put("status","OFFLINE");
        assertThrows(IllegalArgumentException.class,()->service.execute(manifest,true));
        assertTrue(PresentationCleanupService.same(baseline,service.snapshot()));
    }
    @Test void transactionFailureRollsBackChangesTogether() {
        var transaction=new TransactionTemplate(transactionManager);
        transaction.setIsolationLevel(org.springframework.transaction.TransactionDefinition.ISOLATION_SERIALIZABLE);
        assertThrows(IllegalStateException.class,()->transaction.execute(status->{
            service.execute(manifest,true);
            throw new IllegalStateException("Falha após flush, antes do commit");
        }));
        assertTrue(PresentationCleanupService.same(baseline,service.snapshot()));
    }
}
