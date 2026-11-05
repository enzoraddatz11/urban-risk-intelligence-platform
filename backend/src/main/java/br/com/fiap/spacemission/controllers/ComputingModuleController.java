package br.com.fiap.spacemission.controllers;
import br.com.fiap.spacemission.dto.*;
import br.com.fiap.spacemission.services.ComputingModuleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
@RestController
@RequestMapping("/api/modules")
@Validated
public class ComputingModuleController {
    private final ComputingModuleService service;
    public ComputingModuleController(ComputingModuleService service) { this.service = service; }
    @GetMapping
    public PageResponse<ComputingModuleResponse> list(@RequestParam(defaultValue="0") @Min(0) int page,
            @RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return service.list(page, size);
    }
    @GetMapping("/{id}")
    public ComputingModuleResponse get(@PathVariable @Positive Long id) { return service.get(id); }
    @PostMapping
    public ResponseEntity<ComputingModuleResponse> create(@Valid @RequestBody ComputingModuleRequest request) {
        var result = service.create(request);
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(result.id()).toUri();
        return ResponseEntity.created(location).body(result);
    }
}
