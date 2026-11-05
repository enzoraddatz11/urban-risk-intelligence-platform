package br.com.fiap.spacemission.services;
import br.com.fiap.spacemission.dto.*;
import br.com.fiap.spacemission.entities.*;
import br.com.fiap.spacemission.repositories.*;
import br.com.fiap.spacemission.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
@Service
@Transactional(readOnly=true)
public class ComputingModuleService {
    private final ComputingModuleRepository repository;

    public ComputingModuleService(ComputingModuleRepository repository) {
        this.repository = repository;
    }
    public PageResponse<ComputingModuleResponse> list(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        return PageResponse.from(repository.findAll(pageable), ComputingModuleResponse::from);
    }
    public ComputingModuleResponse get(Long id) { return ComputingModuleResponse.from(find(id)); }
    private ComputingModule find(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("ComputingModule", id)); }
    @Transactional
    public ComputingModuleResponse create(ComputingModuleRequest request) {
        ComputingModule entity = new ComputingModule();
        entity.name = request.name();
        entity.description = request.description();
        entity.status = request.status();

        return ComputingModuleResponse.from(repository.save(entity));
    }
}
