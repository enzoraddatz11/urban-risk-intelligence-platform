package br.com.fiap.urbanrisk.dto;
import br.com.fiap.urbanrisk.entities.*;
import br.com.fiap.urbanrisk.privacy.NoPersonalData;
import jakarta.validation.constraints.*;
import java.time.Instant;
/**
 * Relato comunitário anônimo. O contrato não aceita autor, contato nem coordenadas exatas;
 * campos desconhecidos são recusados pela API. Origem e confiança são atribuídas pelo servidor.
 */
public final class ReportDtos {
    private ReportDtos() {}
    public record Request(
            @NotNull @Positive Long regionId,
            @NotNull RiskType riskType,
            @NotBlank @Size(max=500) @NoPersonalData String description,
            @NotNull @PastOrPresent Instant occurredAt) {}
    public record Response(Long id, Long regionId, RiskType riskType, String description, Instant occurredAt,
            DataSource source, Integer confidence, ConfidenceLevel confidenceLevel) {
        public static Response from(CommunityReport e) {
            return new Response(e.id, e.region.getId(), e.riskType, e.description, e.occurredAt, e.source, e.confidence, ConfidenceLevel.of(e.confidence));
        }
    }
}
