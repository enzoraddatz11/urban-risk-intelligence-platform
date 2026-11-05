package br.com.fiap.spacemission.controllers;
import br.com.fiap.spacemission.dto.*;
import br.com.fiap.spacemission.services.MonitoredSystemService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
@RestController
@RequestMapping("/api/systems")
@Validated
public class MonitoredSystemController {
    private final MonitoredSystemService service;
    public MonitoredSystemController(MonitoredSystemService service) { this.service = service; }
    @GetMapping
    public PageResponse<MonitoredSystemResponse> list(@RequestParam(defaultValue="0") @Min(0) int page,
            @RequestParam(defaultValue="20") @Min(1) @Max(100) int size, @RequestParam(required=false) @Positive Long moduleId) {
        return service.list(page, size, moduleId);
    }
    @GetMapping("/{id}")
    public MonitoredSystemResponse get(@PathVariable @Positive Long id) { return service.get(id); }
    @PostMapping
    public ResponseEntity<MonitoredSystemResponse> create(@Valid @RequestBody MonitoredSystemRequest request) {
        var result = service.create(request);
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(result.id()).toUri();
        return ResponseEntity.created(location).body(result);
    }
}
