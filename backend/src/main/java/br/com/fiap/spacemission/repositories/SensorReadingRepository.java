package br.com.fiap.spacemission.repositories;
import br.com.fiap.spacemission.entities.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    org.springframework.data.domain.Page<SensorReading> findBySensorId(Long id, org.springframework.data.domain.Pageable pageable);
}
