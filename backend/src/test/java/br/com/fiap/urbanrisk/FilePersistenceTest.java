package br.com.fiap.urbanrisk;
import br.com.fiap.urbanrisk.entities.*;
import br.com.fiap.urbanrisk.repositories.*;
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
        return new SpringApplicationBuilder(UrbanRiskApplication.class)
            .web(WebApplicationType.NONE).run(
                "--spring.datasource.url=jdbc:h2:file:"+directory.resolve("urban").toAbsolutePath().toString().replace('\\','/'),
                "--app.seed-enabled=true", "--spring.main.banner-mode=off");
    }
    @Test void dadosECargaSimuladaSobrevivemAoReinicioSemDuplicar() {
        Long id;
        try (var first=start()) {
            var repository=first.getBean(RegionRepository.class);
            assertEquals(5,repository.count());
            Region region=new Region();
            region.name="Persistida"; region.city="Teste"; region.description="Reinicialização";
            region.latitude=0.0; region.longitude=0.0; region.source=DataSource.BASE_PUBLICA; region.confidence=80;
            id=repository.saveAndFlush(region).id;
        }
        try (var second=start()) {
            var repository=second.getBean(RegionRepository.class);
            assertEquals(6,repository.count());
            assertEquals("Persistida",repository.findById(id).orElseThrow().name);
            assertEquals(24,second.getBean(SensorReadingRepository.class).count());
            assertEquals(10,second.getBean(CommunityReportRepository.class).count());
        }
    }
}
