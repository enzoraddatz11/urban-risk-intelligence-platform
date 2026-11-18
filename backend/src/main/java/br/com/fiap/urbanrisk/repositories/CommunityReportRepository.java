package br.com.fiap.urbanrisk.repositories;
import br.com.fiap.urbanrisk.entities.CommunityReport;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface CommunityReportRepository extends JpaRepository<CommunityReport, Long> {
    Page<CommunityReport> findByRegionId(Long regionId, Pageable pageable);
    /** Linhas [regionId, RiskType, quantidade] de relatos ocorridos a partir do instante informado. */
    @Query("select c.region.id, c.riskType, count(c) from CommunityReport c where c.occurredAt >= :since group by c.region.id, c.riskType")
    List<Object[]> countByRegionAndTypeSince(@Param("since") Instant since);
}
