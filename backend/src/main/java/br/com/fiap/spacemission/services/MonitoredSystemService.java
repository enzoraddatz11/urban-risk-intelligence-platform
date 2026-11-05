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
public class MonitoredSystemService {
    private final MonitoredSystemRepository repository;
    private final ComputingModuleRepository parentRepository;
    public MonitoredSystemService(MonitoredSystemRepository repository, ComputingModuleRepository parentRepository) {
        this.repository = repository;
        this.parentRepository = parentRepository;
    }
    public PageResponse<MonitoredSystemResponse> list(int page, int size, Long moduleId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (moduleId != null && !parentRepository.existsById(moduleId)) throw new ResourceNotFoundException("ComputingModule", moduleId);
        return PageResponse.from(moduleId == null ? repository.findAll(pageable) : repository.findByModuleId(moduleId, pageable), MonitoredSystemResponse::from);
    }
    public MonitoredSystemResponse get(Long id) { return MonitoredSystemResponse.from(find(id)); }
    private MonitoredSystem find(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("MonitoredSystem", id)); }
    @Transactional
    public MonitoredSystemResponse create(MonitoredSystemRequest request) {
        MonitoredSystem entity = new MonitoredSystem();
        entity.name = request.name();
        entity.description = request.description();
        entity.status = request.status();
        entity.module = parentRepository.findById(request.moduleId()).orElseThrow(() -> new ResourceNotFoundException("ComputingModule", request.moduleId()));
        return MonitoredSystemResponse.from(repository.save(entity));
    }
}
