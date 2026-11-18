package br.com.fiap.urbanrisk;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Carga simulada de Nova Ribeira: verifica volumes e a ordem dos alertas produzida pelo score. */
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:city;DB_CLOSE_DELAY=-1", "app.seed-enabled=true"})
@AutoConfigureMockMvc
class SimulatedCityTest {
    @Autowired MockMvc mvc;

    @Test void cidadeSimuladaGeraAlertasOrdenadosPorPrioridade() throws Exception {
        mvc.perform(get("/api/status")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CRITICO"))
                .andExpect(jsonPath("$.regions").value(5)).andExpect(jsonPath("$.sensors").value(6))
                .andExpect(jsonPath("$.readings").value(24)).andExpect(jsonPath("$.events").value(6))
                .andExpect(jsonPath("$.activeEvents").value(5)).andExpect(jsonPath("$.reports").value(10))
                .andExpect(jsonPath("$.offlineSensors").value(1)).andExpect(jsonPath("$.unstableSensors").value(1));
        mvc.perform(get("/api/alerts")).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[*].riskType", contains("ALAGAMENTO", "ILHA_DE_CALOR", "FALTA_DE_ENERGIA", "FALTA_DE_AGUA", "ALAGAMENTO")))
                .andExpect(jsonPath("$[*].priority", contains("CRITICA", "ALTA", "ALTA", "MEDIA", "BAIXA")))
                .andExpect(jsonPath("$[0].regionName").value("Várzea do Ribeirão"))
                .andExpect(jsonPath("$[0].communityReports").value(3))
                .andExpect(jsonPath("$[3].factors.freshness").value(0))
                .andExpect(jsonPath("$[4].source").value("COMUNITARIO"));
        mvc.perform(get("/api/reports?size=100")).andExpect(jsonPath("$.content[*].description",
                everyItem(not(matchesPattern(".*(@|\\d{4}-\\d{4}).*")))));
    }
}
