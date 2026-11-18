package br.com.fiap.urbanrisk.services;
import br.com.fiap.urbanrisk.dto.PageResponse;
import br.com.fiap.urbanrisk.dto.RegionDtos.*;
import br.com.fiap.urbanrisk.entities.Region;
import br.com.fiap.urbanrisk.exceptions.ResourceNotFoundException;
import br.com.fiap.urbanrisk.repositories.RegionRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@Transactional(readOnly=true)
public class RegionService {
    private final RegionRepository repository;
    public RegionService(RegionRepository repository) { this.repository = repository; }
    public PageResponse<Response> list(int page, int size) {
        return PageResponse.from(repository.findAll(PageRequest.of(page, size, Sort.by("id").descending())), Response::from);
    }
    public Response get(Long id) { return Response.from(find(id)); }
    Region find(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Região", id)); }
    @Transactional
    public Response create(Request request) {
        Region entity = new Region();
        entity.name = request.name().trim();
        entity.city = request.city().trim();
        entity.description = request.description().trim();
        entity.latitude = request.latitude();
        entity.longitude = request.longitude();
        entity.source = request.source();
        entity.confidence = request.confidence();
        return Response.from(repository.save(entity));
    }
}
