package br.com.fiap.spacemission.repositories;
import br.com.fiap.spacemission.entities.OperationalEvent;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OperationalEventRepository extends JpaRepository<OperationalEvent, Long> {

    org.springframework.data.domain.Page<OperationalEvent> findBySystemId(Long id, org.springframework.data.domain.Pageable pageable);
}
