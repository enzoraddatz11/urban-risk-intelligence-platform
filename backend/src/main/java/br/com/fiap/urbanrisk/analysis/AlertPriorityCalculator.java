package br.com.fiap.urbanrisk.analysis;
import br.com.fiap.urbanrisk.entities.*;
import java.time.Duration;
import java.time.Instant;

/**
 * Score de prioridade (0 a 100) de um evento de risco ativo. Combina quatro fatores, cada um normalizado em 0 a 100:
 * <ul>
 *   <li><b>Gravidade</b> (peso 40%): BAIXA 25, MEDIA 50, ALTA 75, CRITICA 100.</li>
 *   <li><b>Confiança da origem</b> (25%): confiança do evento x peso da origem (SENSOR 1,0; BASE_PUBLICA 0,9; COMUNITARIO 0,6).</li>
 *   <li><b>Corroboração comunitária</b> (20%): relatos do mesmo tipo de risco na mesma região nas últimas 24 h,
 *       20 pontos cada, até 5 relatos.</li>
 *   <li><b>Atualidade do monitoramento</b> (15%): 100 se a última leitura de um sensor relacionado ao risco tem até 1 h,
 *       caindo linearmente até 0 em 24 h; 0 quando não há leituras relacionadas na região.</li>
 * </ul>
 * Classe pura, sem acesso a banco, para ser testada isoladamente.
 */
public final class AlertPriorityCalculator {
    public static final double SEVERITY_WEIGHT = 0.40, CONFIDENCE_WEIGHT = 0.25, CORROBORATION_WEIGHT = 0.20, FRESHNESS_WEIGHT = 0.15;
    public static final int MAX_CORROBORATING_REPORTS = 5;
    public static final Duration REPORT_WINDOW = Duration.ofHours(24);
    static final double FRESH_HOURS = 1, STALE_HOURS = 24;

    private AlertPriorityCalculator() {}

    public record Input(Severity severity, DataSource source, int confidence, long communityReports, Instant lastReadingAt, Instant now) {}
    public record Factors(int severity, int confidence, int corroboration, int freshness) {}
    public record Result(int score, Severity priority, Factors factors) {}

    public static Result calculate(Input input) {
        double severity = input.severity().points();
        double confidence = clamp(input.confidence(), 0, 100) * input.source().weight();
        double corroboration = Math.min(Math.max(input.communityReports(), 0), MAX_CORROBORATING_REPORTS) * (100.0 / MAX_CORROBORATING_REPORTS);
        double freshness = freshness(input.lastReadingAt(), input.now());
        int score = (int) clamp(Math.round(severity * SEVERITY_WEIGHT + confidence * CONFIDENCE_WEIGHT
                + corroboration * CORROBORATION_WEIGHT + freshness * FRESHNESS_WEIGHT), 0, 100);
        return new Result(score, priorityOf(score), new Factors((int) Math.round(severity), (int) Math.round(confidence),
                (int) Math.round(corroboration), (int) Math.round(freshness)));
    }

    static double freshness(Instant lastReadingAt, Instant now) {
        if (lastReadingAt == null) return 0;
        double hours = Math.max(0, Duration.between(lastReadingAt, now).toMillis() / 3_600_000.0);
        if (hours <= FRESH_HOURS) return 100;
        if (hours >= STALE_HOURS) return 0;
        return 100 * (STALE_HOURS - hours) / (STALE_HOURS - FRESH_HOURS);
    }

    public static Severity priorityOf(int score) {
        return score >= 75 ? Severity.CRITICA : score >= 55 ? Severity.ALTA : score >= 35 ? Severity.MEDIA : Severity.BAIXA;
    }

    private static double clamp(double value, double min, double max) { return Math.max(min, Math.min(max, value)); }
}
