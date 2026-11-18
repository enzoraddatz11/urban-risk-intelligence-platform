package br.com.fiap.urbanrisk.repositories;
import br.com.fiap.urbanrisk.entities.*;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
public interface RiskEventRepository extends JpaRepository<RiskEvent, Long> {
    long countByStatus(EventStatus status);
    Page<RiskEvent> findByRegionId(Long regionId, Pageable pageable);
    @EntityGraph(attributePaths="region")
    List<RiskEvent> findByStatus(EventStatus status);
}
