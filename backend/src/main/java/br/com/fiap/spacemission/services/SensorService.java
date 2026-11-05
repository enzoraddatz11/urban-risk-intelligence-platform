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
public class SensorService {
    private final SensorRepository repository;
    private final ComputingModuleRepository parentRepository;
    public SensorService(SensorRepository repository, ComputingModuleRepository parentRepository) {
        this.repository = repository;
        this.parentRepository = parentRepository;
    }
    public PageResponse<SensorResponse> list(int page, int size, Long moduleId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (moduleId != null && !parentRepository.existsById(moduleId)) throw new ResourceNotFoundException("ComputingModule", moduleId);
        return PageResponse.from(moduleId == null ? repository.findAll(pageable) : repository.findByModuleId(moduleId, pageable), SensorResponse::from);
    }
    public SensorResponse get(Long id) { return SensorResponse.from(find(id)); }
    private Sensor find(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sensor", id)); }
    @Transactional
    public SensorResponse create(SensorRequest request) {
        Sensor entity = new Sensor();
        entity.name = request.name();
        entity.type = request.type();
        entity.unit = request.unit();
        entity.status = request.status();
        entity.module = parentRepository.findById(request.moduleId()).orElseThrow(() -> new ResourceNotFoundException("ComputingModule", request.moduleId()));
        return SensorResponse.from(repository.save(entity));
    }
}
