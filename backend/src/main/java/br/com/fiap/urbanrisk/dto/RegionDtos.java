package br.com.fiap.urbanrisk.dto;
import br.com.fiap.urbanrisk.entities.*;
import jakarta.validation.constraints.*;
public final class RegionDtos {
    private RegionDtos() {}
    public record Request(
            @NotBlank @Size(max=100) String name,
            @NotBlank @Size(max=100) String city,
            @NotBlank @Size(max=500) String description,
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @NotNull DataSource source,
            @NotNull @Min(0) @Max(100) Integer confidence) {}
    public record Response(Long id, String name, String city, String description, Double latitude, Double longitude,
            DataSource source, Integer confidence, ConfidenceLevel confidenceLevel) {
        public static Response from(Region e) {
            return new Response(e.id, e.name, e.city, e.description, e.latitude, e.longitude, e.source, e.confidence, ConfidenceLevel.of(e.confidence));
        }
    }
}
