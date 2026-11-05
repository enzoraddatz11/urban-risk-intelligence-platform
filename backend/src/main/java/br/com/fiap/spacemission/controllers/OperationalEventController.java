package br.com.fiap.spacemission.controllers;
import br.com.fiap.spacemission.dto.*;
import br.com.fiap.spacemission.services.OperationalEventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
@RestController
@RequestMapping("/api/events")
@Validated
public class OperationalEventController {
    private final OperationalEventService service;
    public OperationalEventController(OperationalEventService service) { this.service = service; }
    @GetMapping
    public PageResponse<OperationalEventResponse> list(@RequestParam(defaultValue="0") @Min(0) int page,
            @RequestParam(defaultValue="20") @Min(1) @Max(100) int size, @RequestParam(required=false) @Positive Long systemId) {
        return service.list(page, size, systemId);
    }
    @GetMapping("/{id}")
    public OperationalEventResponse get(@PathVariable @Positive Long id) { return service.get(id); }
    @PostMapping
    public ResponseEntity<OperationalEventResponse> create(@Valid @RequestBody OperationalEventRequest request) {
        var result = service.create(request);
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(result.id()).toUri();
        return ResponseEntity.created(location).body(result);
    }
}
