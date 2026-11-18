package br.com.fiap.urbanrisk.services;
import br.com.fiap.urbanrisk.dto.PageResponse;
import br.com.fiap.urbanrisk.dto.SensorDtos.*;
import br.com.fiap.urbanrisk.entities.UrbanSensor;
import br.com.fiap.urbanrisk.exceptions.ResourceNotFoundException;
import br.com.fiap.urbanrisk.repositories.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@Transactional(readOnly=true)
public class SensorService {
    private final UrbanSensorRepository repository;
    private final RegionRepository regions;
    public SensorService(UrbanSensorRepository repository, RegionRepository regions) { this.repository = repository; this.regions = regions; }
    public PageResponse<Response> list(int page, int size, Long regionId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (regionId != null && !regions.existsById(regionId)) throw new ResourceNotFoundException("Região", regionId);
        return PageResponse.from(regionId == null ? repository.findAll(pageable) : repository.findByRegionId(regionId, pageable), Response::from);
    }
    public Response get(Long id) { return Response.from(repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sensor", id))); }
    @Transactional
    public Response create(Request request) {
        UrbanSensor entity = new UrbanSensor();
        entity.name = request.name().trim();
        entity.type = request.type();
        entity.unit = request.unit().trim();
        entity.status = request.status();
        entity.source = request.source();
        entity.confidence = request.confidence();
        entity.region = regions.findById(request.regionId()).orElseThrow(() -> new ResourceNotFoundException("Região", request.regionId()));
        return Response.from(repository.save(entity));
    }
}
