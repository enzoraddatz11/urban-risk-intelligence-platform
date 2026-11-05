package br.com.fiap.spacemission.controllers;
import br.com.fiap.spacemission.dto.*;
import br.com.fiap.spacemission.services.CriticalAlertService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
@RestController
@RequestMapping("/api/alerts")
@Validated
public class CriticalAlertController {
    private final CriticalAlertService service;
    public CriticalAlertController(CriticalAlertService service) { this.service = service; }
    @GetMapping
    public PageResponse<CriticalAlertResponse> list(@RequestParam(defaultValue="0") @Min(0) int page,
            @RequestParam(defaultValue="20") @Min(1) @Max(100) int size, @RequestParam(required=false) @Positive Long systemId) {
        return service.list(page, size, systemId);
    }
    @GetMapping("/{id}")
    public CriticalAlertResponse get(@PathVariable @Positive Long id) { return service.get(id); }
    @PostMapping
    public ResponseEntity<CriticalAlertResponse> create(@Valid @RequestBody CriticalAlertRequest request) {
        var result = service.create(request);
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(result.id()).toUri();
        return ResponseEntity.created(location).body(result);
    }
}
