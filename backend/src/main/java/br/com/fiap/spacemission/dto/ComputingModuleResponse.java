package br.com.fiap.spacemission.dto;
import br.com.fiap.spacemission.entities.*;
public record ComputingModuleResponse(Long id, String name, String description, HealthStatus status) {
    public static ComputingModuleResponse from(ComputingModule entity) {
        return new ComputingModuleResponse(entity.id, entity.name, entity.description, entity.status);
    }
}
