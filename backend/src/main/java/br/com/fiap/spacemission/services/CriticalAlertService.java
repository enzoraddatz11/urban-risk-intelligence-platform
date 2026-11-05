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
public class CriticalAlertService {
    private final CriticalAlertRepository repository;
    private final MonitoredSystemRepository parentRepository;
    public CriticalAlertService(CriticalAlertRepository repository, MonitoredSystemRepository parentRepository) {
        this.repository = repository;
        this.parentRepository = parentRepository;
    }
    public PageResponse<CriticalAlertResponse> list(int page, int size, Long systemId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (systemId != null && !parentRepository.existsById(systemId)) throw new ResourceNotFoundException("MonitoredSystem", systemId);
        return PageResponse.from(systemId == null ? repository.findAll(pageable) : repository.findBySystemId(systemId, pageable), CriticalAlertResponse::from);
    }
    public CriticalAlertResponse get(Long id) { return CriticalAlertResponse.from(find(id)); }
    private CriticalAlert find(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("CriticalAlert", id)); }
    @Transactional
    public CriticalAlertResponse create(CriticalAlertRequest request) {
        CriticalAlert entity = new CriticalAlert();
        entity.title = request.title();
        entity.description = request.description();
        entity.status = request.status();
        entity.occurredAt = request.occurredAt();
        entity.system = parentRepository.findById(request.systemId()).orElseThrow(() -> new ResourceNotFoundException("MonitoredSystem", request.systemId()));
        return CriticalAlertResponse.from(repository.save(entity));
    }
}
