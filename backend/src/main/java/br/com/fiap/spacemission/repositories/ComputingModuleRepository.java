package br.com.fiap.spacemission.repositories;
import br.com.fiap.spacemission.entities.ComputingModule;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ComputingModuleRepository extends JpaRepository<ComputingModule, Long> {
    long countByStatus(br.com.fiap.spacemission.entities.HealthStatus status);

}
