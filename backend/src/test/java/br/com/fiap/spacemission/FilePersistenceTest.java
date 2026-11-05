package br.com.fiap.spacemission;
import br.com.fiap.spacemission.entities.*;
import br.com.fiap.spacemission.repositories.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;
class FilePersistenceTest {
    @TempDir Path directory;
    private ConfigurableApplicationContext start() {
        return new SpringApplicationBuilder(SpaceMissionApplication.class)
            .web(WebApplicationType.NONE).run(
                "--spring.datasource.url=jdbc:h2:file:"+directory.resolve("mission").toAbsolutePath().toString().replace('\\','/'),
                "--app.seed-enabled=true", "--spring.main.banner-mode=off");
    }
    @Test void dataAndSeedSurviveRestartWithoutDuplication() {
        Long id;
        try (var first=start()) {
            var repository=first.getBean(ComputingModuleRepository.class);
            assertEquals(1,repository.count());
            ComputingModule module=new ComputingModule();
            module.name="Persistido"; module.description="Reinicialização"; module.status=HealthStatus.OPERATIONAL;
            id=repository.saveAndFlush(module).id;
        }
        try (var second=start()) {
            var repository=second.getBean(ComputingModuleRepository.class);
            assertEquals(2,repository.count());
            assertEquals("Persistido",repository.findById(id).orElseThrow().name);
            assertEquals(1,second.getBean(SensorReadingRepository.class).count());
            assertEquals(1,second.getBean(CriticalAlertRepository.class).count());
        }
    }
}
