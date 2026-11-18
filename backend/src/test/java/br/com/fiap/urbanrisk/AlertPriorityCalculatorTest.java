package br.com.fiap.urbanrisk;
import br.com.fiap.urbanrisk.analysis.AlertPriorityCalculator;
import br.com.fiap.urbanrisk.analysis.AlertPriorityCalculator.*;
import br.com.fiap.urbanrisk.entities.*;
import java.time.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AlertPriorityCalculatorTest {
    static final Instant NOW = Instant.parse("2026-11-18T12:00:00Z");
    static Result score(Severity severity, DataSource source, int confidence, long reports, Duration readingAgo) {
        return AlertPriorityCalculator.calculate(new Input(severity, source, confidence, reports, readingAgo == null ? null : NOW.minus(readingAgo), NOW));
    }

    @Test void combinaOsQuatroFatoresComOsPesosDocumentados() {
        // 100*0,40 + 80*0,25 + 40*0,20 + 100*0,15 = 40 + 20 + 8 + 15
        Result result = score(Severity.CRITICA, DataSource.SENSOR, 80, 2, Duration.ofMinutes(30));
        assertEquals(83, result.score());
        assertEquals(Severity.CRITICA, result.priority());
        assertEquals(new Factors(100, 80, 40, 100), result.factors());
    }

    @Test void origemPonderaAConfianca() {
        assertEquals(50, score(Severity.ALTA, DataSource.SENSOR, 80, 0, null).score());
        assertEquals(48, score(Severity.ALTA, DataSource.BASE_PUBLICA, 80, 0, null).score());
        Result community = score(Severity.ALTA, DataSource.COMUNITARIO, 80, 0, null);
        assertEquals(42, community.score());
        assertEquals(48, community.factors().confidence());
    }

    @Test void relatosNaRegiaoAumentamAPrioridadeAteOLimite() {
        int none = score(Severity.MEDIA, DataSource.SENSOR, 0, 0, null).score();
        int five = score(Severity.MEDIA, DataSource.SENSOR, 0, 5, null).score();
        int twelve = score(Severity.MEDIA, DataSource.SENSOR, 0, 12, null).score();
        assertEquals(20, none);
        assertEquals(40, five);
        assertEquals(five, twelve, "acima de 5 relatos não há ganho adicional");
        assertTrue(score(Severity.MEDIA, DataSource.SENSOR, 0, 1, null).score() > none);
    }

    @Test void leituraRecenteVaiAZeroApos24Horas() {
        assertEquals(100, score(Severity.BAIXA, DataSource.SENSOR, 0, 0, Duration.ofMinutes(30)).factors().freshness());
        assertEquals(50, score(Severity.BAIXA, DataSource.SENSOR, 0, 0, Duration.ofMinutes(750)).factors().freshness());
        assertEquals(0, score(Severity.BAIXA, DataSource.SENSOR, 0, 0, Duration.ofHours(24)).factors().freshness());
        assertEquals(0, score(Severity.BAIXA, DataSource.SENSOR, 0, 0, Duration.ofHours(30)).factors().freshness());
        assertEquals(0, score(Severity.BAIXA, DataSource.SENSOR, 0, 0, null).factors().freshness(), "sem leitura relacionada");
        assertEquals(100, score(Severity.BAIXA, DataSource.SENSOR, 0, 0, Duration.ofMinutes(-5)).factors().freshness(), "relógio adiantado não gera valor acima de 100");
    }

    @Test void eventoMenosGraveMasConfirmadoPodeSuperarUmMaisGraveSemEvidencias() {
        int confirmed = score(Severity.MEDIA, DataSource.SENSOR, 90, 3, Duration.ofMinutes(10)).score();
        int unconfirmed = score(Severity.ALTA, DataSource.COMUNITARIO, 40, 0, null).score();
        assertTrue(confirmed > unconfirmed, confirmed + " deveria superar " + unconfirmed);
    }

    @Test void gravidadeDesempataQuandoOsDemaisFatoresSaoIguais() {
        int previous = -1;
        for (Severity severity : Severity.values()) {
            int current = score(severity, DataSource.SENSOR, 70, 1, Duration.ofHours(2)).score();
            assertTrue(current > previous);
            previous = current;
        }
    }

    @Test void confiancaForaDoIntervaloELimitada() {
        assertEquals(100, score(Severity.BAIXA, DataSource.SENSOR, 150, 0, null).factors().confidence());
        assertEquals(0, score(Severity.BAIXA, DataSource.SENSOR, -10, 0, null).factors().confidence());
        assertEquals(100, score(Severity.CRITICA, DataSource.SENSOR, 100, 99, Duration.ZERO).score());
    }

    @Test void faixasDePrioridade() {
        assertEquals(Severity.CRITICA, AlertPriorityCalculator.priorityOf(75));
        assertEquals(Severity.ALTA, AlertPriorityCalculator.priorityOf(74));
        assertEquals(Severity.ALTA, AlertPriorityCalculator.priorityOf(55));
        assertEquals(Severity.MEDIA, AlertPriorityCalculator.priorityOf(54));
        assertEquals(Severity.MEDIA, AlertPriorityCalculator.priorityOf(35));
        assertEquals(Severity.BAIXA, AlertPriorityCalculator.priorityOf(34));
    }

    @Test void nivelTextualDeConfianca() {
        assertEquals(ConfidenceLevel.ALTO, ConfidenceLevel.of(70));
        assertEquals(ConfidenceLevel.MEDIO, ConfidenceLevel.of(69));
        assertEquals(ConfidenceLevel.MEDIO, ConfidenceLevel.of(40));
        assertEquals(ConfidenceLevel.BAIXO, ConfidenceLevel.of(39));
    }
}
