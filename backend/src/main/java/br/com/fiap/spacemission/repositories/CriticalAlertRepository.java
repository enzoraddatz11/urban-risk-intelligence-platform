package br.com.fiap.spacemission.repositories;
import br.com.fiap.spacemission.entities.CriticalAlert;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CriticalAlertRepository extends JpaRepository<CriticalAlert, Long> {
    long countByStatus(br.com.fiap.spacemission.entities.AlertStatus status);
    org.springframework.data.domain.Page<CriticalAlert> findBySystemId(Long id, org.springframework.data.domain.Pageable pageable);
}
