package br.com.fiap.spacemission.controllers;
import br.com.fiap.spacemission.services.MissionStatusService;
import br.com.fiap.spacemission.dto.MissionStatusResponse;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/mission/status")
public class MissionStatusController {
    private final MissionStatusService service;
    public MissionStatusController(MissionStatusService service) { this.service = service; }
    @GetMapping public MissionStatusResponse get() { return service.get(); }
}
