package br.com.fiap.urbanrisk;
import br.com.fiap.urbanrisk.repositories.*;
import com.fasterxml.jackson.databind.*;
import java.time.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:api;DB_CLOSE_DELAY=-1", "app.seed-enabled=false"})
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired CommunityReportRepository reports;
    @Autowired RiskEventRepository events;
    @Autowired SensorReadingRepository readings;
    @Autowired UrbanSensorRepository sensors;
    @Autowired RegionRepository regions;

    @BeforeEach void limparBanco() {
        reports.deleteAll(); events.deleteAll(); readings.deleteAll(); sensors.deleteAll(); regions.deleteAll();
    }

    private long create(String path, String body) throws Exception {
        var result = mvc.perform(post("/api/"+path).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(header().exists("Location")).andReturn();
        long id = json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(get("/api/"+path+"/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.source").exists()).andExpect(jsonPath("$.confidence").exists()).andExpect(jsonPath("$.confidenceLevel").exists());
        return id;
    }
    private ResultActions postJson(String path, String body) throws Exception {
        return mvc.perform(post("/api/"+path).contentType(MediaType.APPLICATION_JSON).content(body));
    }
    private static String ago(Duration duration) { return Instant.now().minus(duration).toString(); }

    @Test void fluxoCompletoComAlertasPriorizados() throws Exception {
        mvc.perform(get("/api/status")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("SEM_DADOS"));
        long region = create("regions", """
            {"name":"Vila Teste","city":"Cidade Teste","description":"Bairro de teste","latitude":-23.5,"longitude":-46.6,"source":"BASE_PUBLICA","confidence":95}
            """);
        mvc.perform(get("/api/status")).andExpect(jsonPath("$.status").value("NORMAL"));
        long sensor = create("sensors", """
            {"name":"Pluviômetro","type":"PLUVIOMETRO","unit":"mm/h","status":"OPERANTE","regionId":%d,"source":"SENSOR","confidence":90}
            """.formatted(region));
        mvc.perform(get("/api/sensors/"+sensor)).andExpect(jsonPath("$.regionId").value(region)).andExpect(jsonPath("$.confidenceLevel").value("ALTO"));
        create("readings", """
            {"sensorId":%d,"value":42.5,"recordedAt":"%s","source":"SENSOR","confidence":90}
            """.formatted(sensor, ago(Duration.ofMinutes(5))));

        // Evento de gravidade MEDIA, medido por sensor e confirmado por dois relatos.
        long flood = create("events", """
            {"title":"Rua alagada","description":"Nível subindo","type":"ALAGAMENTO","severity":"MEDIA","status":"ATIVO",
             "occurredAt":"%s","regionId":%d,"source":"SENSOR","confidence":90}
            """.formatted(ago(Duration.ofMinutes(10)), region));
        // Evento de gravidade ALTA, mas só com informação comunitária de baixa confiança.
        long water = create("events", """
            {"title":"Sem água","description":"Relato isolado","type":"FALTA_DE_AGUA","severity":"ALTA","status":"ATIVO",
             "occurredAt":"%s","regionId":%d,"source":"COMUNITARIO","confidence":40}
            """.formatted(ago(Duration.ofMinutes(10)), region));
        create("events", """
            {"title":"Encerrado","description":"Não entra nos alertas","type":"ILHA_DE_CALOR","severity":"CRITICA","status":"ENCERRADO",
             "occurredAt":"%s","regionId":%d,"source":"BASE_PUBLICA","confidence":90}
            """.formatted(ago(Duration.ofDays(2)), region));
        for (String text : new String[]{"Água na altura do joelho.", "Bueiro transbordando na esquina."}) {
            long report = create("reports", """
                {"regionId":%d,"riskType":"ALAGAMENTO","description":"%s","occurredAt":"%s"}
                """.formatted(region, text, ago(Duration.ofMinutes(3))));
            mvc.perform(get("/api/reports/"+report)).andExpect(jsonPath("$.source").value("COMUNITARIO"))
                    .andExpect(jsonPath("$.confidence").value(40)).andExpect(jsonPath("$.confidenceLevel").value("MEDIO"));
        }

        mvc.perform(get("/api/alerts")).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].eventId").value(flood))
                .andExpect(jsonPath("$[0].source").value("SENSOR"))
                .andExpect(jsonPath("$[0].confidence").value(90))
                .andExpect(jsonPath("$[0].confidenceLevel").value("ALTO"))
                .andExpect(jsonPath("$[0].communityReports").value(2))
                .andExpect(jsonPath("$[0].regionName").value("Vila Teste"))
                .andExpect(jsonPath("$[0].factors.freshness").value(100))
                .andExpect(jsonPath("$[0].priority").value("ALTA"))
                .andExpect(jsonPath("$[1].eventId").value(water))
                .andExpect(jsonPath("$[1].source").value("COMUNITARIO"))
                .andExpect(jsonPath("$[1].confidenceLevel").value("MEDIO"))
                .andExpect(jsonPath("$[1].lastReadingAt").value(nullValue()))
                .andExpect(jsonPath("$[0].score", greaterThan(0)));
        mvc.perform(get("/api/alerts?limit=1")).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/alerts?regionId="+region)).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/status")).andExpect(jsonPath("$.status").value("ATENCAO"))
                .andExpect(jsonPath("$.activeEvents").value(2)).andExpect(jsonPath("$.reports").value(2))
                .andExpect(jsonPath("$.highAlerts").value(1));

        for (String path : new String[]{"regions","sensors","readings"}) {
            mvc.perform(get("/api/"+path)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        }
        mvc.perform(get("/api/events?regionId="+region)).andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(get("/api/readings").param("sensorId", String.valueOf(sensor)))
                .andExpect(jsonPath("$.content[0].value").value(42.5)).andExpect(jsonPath("$.content[0].sensorId").value(sensor));
    }

    @Test void relatoComunitarioNaoAceitaDadosPessoais() throws Exception {
        long region = create("regions", """
            {"name":"Bairro Privacidade","city":"Cidade Teste","description":"Teste","latitude":0,"longitude":0,"source":"BASE_PUBLICA","confidence":90}
            """);
        String now = ago(Duration.ofMinutes(1));
        postJson("reports", """
            {"regionId":%d,"riskType":"FALTA_DE_ENERGIA","description":"Sem luz, me liguem no (11) 98765-4321","occurredAt":"%s"}
            """.formatted(region, now)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.description", containsString("dados pessoais")));
        postJson("reports", """
            {"regionId":%d,"riskType":"FALTA_DE_ENERGIA","description":"Sem luz","occurredAt":"%s","authorName":"Fulano"}
            """.formatted(region, now)).andExpect(status().isBadRequest());
        postJson("reports", """
            {"regionId":%d,"riskType":"FALTA_DE_ENERGIA","description":"Sem luz","occurredAt":"%s","source":"SENSOR","confidence":100}
            """.formatted(region, now)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/reports?regionId="+region)).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test void validacoesEErros() throws Exception {
        postJson("regions", """
            {"name":" ","city":"C","description":"D","latitude":0,"longitude":0,"source":"BASE_PUBLICA","confidence":90}
            """).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.name").exists());
        postJson("regions", """
            {"name":"A","city":"C","description":"D","latitude":0,"longitude":0,"source":"BASE_PUBLICA","confidence":101}
            """).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.confidence").exists());
        postJson("regions", """
            {"name":"A","city":"C","description":"D","latitude":91,"longitude":0,"source":"BASE_PUBLICA","confidence":50}
            """).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.latitude").exists());
        postJson("regions", """
            {"name":"A","city":"C","description":"D","latitude":0,"longitude":0,"source":"SATELITE","confidence":50}
            """).andExpect(status().isBadRequest());
        postJson("sensors", """
            {"name":"S","type":"PLUVIOMETRO","unit":"mm","status":"OPERANTE","regionId":999999,"source":"SENSOR","confidence":90}
            """).andExpect(status().isNotFound());
        postJson("events", """
            {"title":"T","description":"D","type":"TERREMOTO","severity":"ALTA","status":"ATIVO","occurredAt":"2020-01-01T00:00:00Z","regionId":1,"source":"SENSOR","confidence":90}
            """).andExpect(status().isBadRequest());
        postJson("reports", """
            {"regionId":1,"riskType":"ALAGAMENTO","description":"Futuro","occurredAt":"2999-01-01T00:00:00Z"}
            """).andExpect(status().isBadRequest());
        mvc.perform(get("/api/sensors/999999")).andExpect(status().isNotFound());
        mvc.perform(get("/api/sensors/abc")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/sensors?page=-1")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/sensors?size=101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/sensors?regionId=999999")).andExpect(status().isNotFound());
        mvc.perform(get("/api/alerts?regionId=999999")).andExpect(status().isNotFound());
        mvc.perform(get("/api/alerts?limit=0")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content("{")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/events").contentType(MediaType.TEXT_PLAIN).content("x")).andExpect(status().isUnsupportedMediaType());
        mvc.perform(get("/api/mission/status")).andExpect(status().isNotFound());
    }
}
