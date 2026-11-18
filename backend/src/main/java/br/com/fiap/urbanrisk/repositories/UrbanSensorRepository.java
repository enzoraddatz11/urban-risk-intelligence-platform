package br.com.fiap.urbanrisk.repositories;
import br.com.fiap.urbanrisk.entities.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UrbanSensorRepository extends JpaRepository<UrbanSensor, Long> {
    long countByStatus(SensorStatus status);
    Page<UrbanSensor> findByRegionId(Long regionId, Pageable pageable);
}
