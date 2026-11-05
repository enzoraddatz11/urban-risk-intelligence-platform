package br.com.fiap.spacemission.repositories;
import br.com.fiap.spacemission.entities.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SensorRepository extends JpaRepository<Sensor, Long> {
    long countByStatus(br.com.fiap.spacemission.entities.HealthStatus status);
    org.springframework.data.domain.Page<Sensor> findByModuleId(Long id, org.springframework.data.domain.Pageable pageable);
}
