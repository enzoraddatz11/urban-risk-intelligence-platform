package br.com.fiap.spacemission.repositories;
import br.com.fiap.spacemission.entities.MonitoredSystem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MonitoredSystemRepository extends JpaRepository<MonitoredSystem, Long> {
    long countByStatus(br.com.fiap.spacemission.entities.HealthStatus status);
    org.springframework.data.domain.Page<MonitoredSystem> findByModuleId(Long id, org.springframework.data.domain.Pageable pageable);
}
