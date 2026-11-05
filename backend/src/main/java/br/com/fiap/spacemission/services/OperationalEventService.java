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
public class OperationalEventService {
    private final OperationalEventRepository repository;
    private final MonitoredSystemRepository parentRepository;
    public OperationalEventService(OperationalEventRepository repository, MonitoredSystemRepository parentRepository) {
        this.repository = repository;
        this.parentRepository = parentRepository;
    }
    public PageResponse<OperationalEventResponse> list(int page, int size, Long systemId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (systemId != null && !parentRepository.existsById(systemId)) throw new ResourceNotFoundException("MonitoredSystem", systemId);
        return PageResponse.from(systemId == null ? repository.findAll(pageable) : repository.findBySystemId(systemId, pageable), OperationalEventResponse::from);
    }
    public OperationalEventResponse get(Long id) { return OperationalEventResponse.from(find(id)); }
    private OperationalEvent find(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("OperationalEvent", id)); }
    @Transactional
    public OperationalEventResponse create(OperationalEventRequest request) {
        OperationalEvent entity = new OperationalEvent();
        entity.title = request.title();
        entity.description = request.description();
        entity.severity = request.severity();
        entity.occurredAt = request.occurredAt();
        entity.system = parentRepository.findById(request.systemId()).orElseThrow(() -> new ResourceNotFoundException("MonitoredSystem", request.systemId()));
        return OperationalEventResponse.from(repository.save(entity));
    }
}
