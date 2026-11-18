package br.com.fiap.urbanrisk.controllers;
import br.com.fiap.urbanrisk.dto.AlertResponse;
import br.com.fiap.urbanrisk.services.AlertService;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
/** Alertas priorizados: eventos ativos ordenados pelo score de prioridade (maior primeiro). */
@RestController
@RequestMapping("/api/alerts")
@Validated
public class AlertController {
    private final AlertService service;
    public AlertController(AlertService service) { this.service = service; }
    @GetMapping
    public List<AlertResponse> list(@RequestParam(required=false) @Positive Long regionId,
            @RequestParam(defaultValue="50") @Min(1) @Max(100) int limit) {
        return service.prioritized(regionId, limit);
    }
}
