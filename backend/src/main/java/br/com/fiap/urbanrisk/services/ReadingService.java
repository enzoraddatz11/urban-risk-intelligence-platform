package br.com.fiap.urbanrisk.services;
import br.com.fiap.urbanrisk.dto.PageResponse;
import br.com.fiap.urbanrisk.dto.ReadingDtos.*;
import br.com.fiap.urbanrisk.entities.SensorReading;
import br.com.fiap.urbanrisk.exceptions.ResourceNotFoundException;
import br.com.fiap.urbanrisk.repositories.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@Transactional(readOnly=true)
public class ReadingService {
    private final SensorReadingRepository repository;
    private final UrbanSensorRepository sensors;
    public ReadingService(SensorReadingRepository repository, UrbanSensorRepository sensors) { this.repository = repository; this.sensors = sensors; }
    public PageResponse<Response> list(int page, int size, Long sensorId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (sensorId != null && !sensors.existsById(sensorId)) throw new ResourceNotFoundException("Sensor", sensorId);
        return PageResponse.from(sensorId == null ? repository.findAll(pageable) : repository.findBySensorId(sensorId, pageable), Response::from);
    }
    public Response get(Long id) { return Response.from(repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Leitura", id))); }
    @Transactional
    public Response create(Request request) {
        SensorReading entity = new SensorReading();
        entity.value = request.value();
        entity.recordedAt = request.recordedAt();
        entity.source = request.source();
        entity.confidence = request.confidence();
        entity.sensor = sensors.findById(request.sensorId()).orElseThrow(() -> new ResourceNotFoundException("Sensor", request.sensorId()));
        return Response.from(repository.save(entity));
    }
}
