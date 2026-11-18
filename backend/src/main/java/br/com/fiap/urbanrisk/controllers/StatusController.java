package br.com.fiap.urbanrisk.controllers;
import br.com.fiap.urbanrisk.dto.StatusResponse;
import br.com.fiap.urbanrisk.services.StatusService;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/status")
public class StatusController {
    private final StatusService service;
    public StatusController(StatusService service) { this.service = service; }
    @GetMapping public StatusResponse get() { return service.get(); }
}
