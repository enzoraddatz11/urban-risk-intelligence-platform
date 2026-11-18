package br.com.fiap.urbanrisk.services;
import br.com.fiap.urbanrisk.dto.PageResponse;
import br.com.fiap.urbanrisk.dto.EventDtos.*;
import br.com.fiap.urbanrisk.entities.RiskEvent;
import br.com.fiap.urbanrisk.exceptions.ResourceNotFoundException;
import br.com.fiap.urbanrisk.repositories.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@Transactional(readOnly=true)
public class EventService {
    private final RiskEventRepository repository;
    private final RegionRepository regions;
    public EventService(RiskEventRepository repository, RegionRepository regions) { this.repository = repository; this.regions = regions; }
    public PageResponse<Response> list(int page, int size, Long regionId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("occurredAt").descending().and(Sort.by("id").descending()));
        if (regionId != null && !regions.existsById(regionId)) throw new ResourceNotFoundException("Região", regionId);
        return PageResponse.from(regionId == null ? repository.findAll(pageable) : repository.findByRegionId(regionId, pageable), Response::from);
    }
    public Response get(Long id) { return Response.from(repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Evento", id))); }
    @Transactional
    public Response create(Request request) {
        RiskEvent entity = new RiskEvent();
        entity.title = request.title().trim();
        entity.description = request.description().trim();
        entity.type = request.type();
        entity.severity = request.severity();
        entity.status = request.status();
        entity.occurredAt = request.occurredAt();
        entity.source = request.source();
        entity.confidence = request.confidence();
        entity.region = regions.findById(request.regionId()).orElseThrow(() -> new ResourceNotFoundException("Região", request.regionId()));
        return Response.from(repository.save(entity));
    }
}
