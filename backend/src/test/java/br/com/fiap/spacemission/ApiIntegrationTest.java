package br.com.fiap.spacemission;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:api;DB_CLOSE_DELAY=-1", "app.seed-enabled=false"})
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    private long create(String path, String body) throws Exception {
        var result = mvc.perform(post("/api/"+path).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(header().exists("Location")).andReturn();
        long id=json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(get("/api/"+path+"/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
        return id;
    }
    @Test void completeMissionFlowAndValidation() throws Exception {
        mvc.perform(get("/api/mission/status")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UNKNOWN"));
        long module=create("modules", """ 
            {"name":"Computador","description":"Bordo","status":"OPERATIONAL"}
            """);
        long sensor=create("sensors", """
            {"name":"Temperatura","type":"TEMPERATURE","unit":"C","status":"OPERATIONAL","moduleId":%d}
            """.formatted(module));
        mvc.perform(get("/api/sensors/"+sensor)).andExpect(jsonPath("$.moduleId").value(module));
        mvc.perform(get("/api/mission/status")).andExpect(jsonPath("$.status").value("NOMINAL"));
        long system=create("systems", """
            {"name":"Ambiente","description":"Cabine","status":"DEGRADED","moduleId":%d}
            """.formatted(module));
        create("readings", """
            {"sensorId":%d,"value":23.5,"recordedAt":"2020-01-01T00:00:00Z"}
            """.formatted(sensor));
        create("events", """
            {"systemId":%d,"title":"Teste","description":"Telemetria","severity":"INFO","occurredAt":"2020-01-01T00:00:00Z"}
            """.formatted(system));
        mvc.perform(get("/api/mission/status")).andExpect(jsonPath("$.status").value("WARNING"));
        create("alerts", """
            {"systemId":%d,"title":"Oxigenio","description":"Verificar","status":"ACTIVE","occurredAt":"2020-01-01T00:00:00Z"}
            """.formatted(system));
        mvc.perform(get("/api/mission/status")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CRITICAL")).andExpect(jsonPath("$.activeCriticalAlerts").value(1));
        for (String path : new String[]{"modules","sensors","systems","readings","events","alerts"}) {
            mvc.perform(get("/api/"+path)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        }
        mvc.perform(get("/api/systems/"+system)).andExpect(jsonPath("$.moduleId").value(module));
        mvc.perform(get("/api/readings").param("sensorId",String.valueOf(sensor)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].value").value(23.5))
                .andExpect(jsonPath("$.content[0].sensorId").value(sensor));
        mvc.perform(post("/api/modules").contentType(MediaType.APPLICATION_JSON).content("""
            {"name":" ","description":"teste","status":"OPERATIONAL"}
            """)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.name").exists());
        mvc.perform(post("/api/modules").contentType(MediaType.APPLICATION_JSON).content("""
            {"name":"Teste","description":"teste","status":"INVALID"}
            """)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/sensors").contentType(MediaType.APPLICATION_JSON).content("""
            {"name":"Teste","type":"TEMP","unit":"C","status":"OPERATIONAL","moduleId":999999}
            """)).andExpect(status().isNotFound());
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON).content("""
            {"sensorId":%d,"value":1,"recordedAt":"2999-01-01T00:00:00Z"}
            """.formatted(sensor))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/sensors/999999")).andExpect(status().isNotFound());
        mvc.perform(get("/api/sensors/abc")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/sensors?page=-1")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/sensors?size=101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/sensors?moduleId=999999")).andExpect(status().isNotFound());
        mvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content("{")).andExpect(status().isBadRequest());
    }
}
