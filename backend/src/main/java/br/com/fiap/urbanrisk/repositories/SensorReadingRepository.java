package br.com.fiap.urbanrisk.repositories;
import br.com.fiap.urbanrisk.entities.SensorReading;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    Page<SensorReading> findBySensorId(Long sensorId, Pageable pageable);
    /** Linhas [regionId, SensorType, Instant]: horário da leitura mais recente por região e tipo de sensor. */
    @Query("select s.region.id, s.type, max(r.recordedAt) from SensorReading r join r.sensor s group by s.region.id, s.type")
    List<Object[]> latestByRegionAndSensorType();
}
