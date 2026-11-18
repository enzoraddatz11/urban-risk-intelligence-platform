package br.com.fiap.urbanrisk.controllers;
import br.com.fiap.urbanrisk.dto.PageResponse;
import br.com.fiap.urbanrisk.dto.EventDtos.*;
import br.com.fiap.urbanrisk.services.EventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/events")
@Validated
public class EventController {
    private final EventService service;
    public EventController(EventService service) { this.service = service; }
    @GetMapping
    public PageResponse<Response> list(@RequestParam(defaultValue="0") @Min(0) int page,
            @RequestParam(defaultValue="20") @Min(1) @Max(100) int size, @RequestParam(required=false) @Positive Long regionId) {
        return service.list(page, size, regionId);
    }
    @GetMapping("/{id}")
    public Response get(@PathVariable @Positive Long id) { return service.get(id); }
    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody Request request) { return Created.of(service.create(request), Response::id); }
}
