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
public class SensorReadingService {
    private final SensorReadingRepository repository;
    private final SensorRepository parentRepository;
    public SensorReadingService(SensorReadingRepository repository, SensorRepository parentRepository) {
        this.repository = repository;
        this.parentRepository = parentRepository;
    }
    public PageResponse<SensorReadingResponse> list(int page, int size, Long sensorId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (sensorId != null && !parentRepository.existsById(sensorId)) throw new ResourceNotFoundException("Sensor", sensorId);
        return PageResponse.from(sensorId == null ? repository.findAll(pageable) : repository.findBySensorId(sensorId, pageable), SensorReadingResponse::from);
    }
    public SensorReadingResponse get(Long id) { return SensorReadingResponse.from(find(id)); }
    private SensorReading find(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("SensorReading", id)); }
    @Transactional
    public SensorReadingResponse create(SensorReadingRequest request) {
        SensorReading entity = new SensorReading();
        entity.value = request.value();
        entity.recordedAt = request.recordedAt();
        entity.sensor = parentRepository.findById(request.sensorId()).orElseThrow(() -> new ResourceNotFoundException("Sensor", request.sensorId()));
        return SensorReadingResponse.from(repository.save(entity));
    }
}
