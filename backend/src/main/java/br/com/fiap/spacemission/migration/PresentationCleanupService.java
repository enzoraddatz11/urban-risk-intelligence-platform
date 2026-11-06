package br.com.fiap.spacemission.migration;

import br.com.fiap.spacemission.dto.*;
import br.com.fiap.spacemission.entities.*;
import br.com.fiap.spacemission.repositories.*;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import jakarta.persistence.EntityManager;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

/** Migração local explícita, sem endpoints e sem inicialização automática. */
@Service
@ConditionalOnProperty(name="app.presentation-cleanup.enabled", havingValue="true")
public class PresentationCleanupService {
    public static final String SCOPE = "space-mission-control/presentation-text-cleanup/v1";
    private static final Set<String> RESOURCES = Set.of("modules", "sensors", "systems", "readings", "events", "alerts");
    private final ComputingModuleRepository modules;
    private final SensorRepository sensors;
    private final MonitoredSystemRepository systems;
    private final SensorReadingRepository readings;
    private final OperationalEventRepository events;
    private final CriticalAlertRepository alerts;
    private final EntityManager entityManager;
    private final ObjectMapper json;

    public PresentationCleanupService(ComputingModuleRepository modules, SensorRepository sensors,
            MonitoredSystemRepository systems, SensorReadingRepository readings, OperationalEventRepository events,
            CriticalAlertRepository alerts, EntityManager entityManager, ObjectMapper json) {
        this.modules=modules; this.sensors=sensors; this.systems=systems; this.readings=readings;
        this.events=events; this.alerts=alerts; this.entityManager=entityManager; this.json=json;
    }

    public record Report(boolean dryRun, boolean alreadyApplied, int changedRecords,
            int preservedRecords, Map<String,Integer> totals, JsonNode records) {}

    @Transactional(isolation=Isolation.SERIALIZABLE)
    public Report execute(JsonNode manifest, boolean apply) {
        require(SCOPE.equals(manifest.path("scope").asText()), "Escopo do manifesto inválido");
        JsonNode expected = manifest.path("records");
        require(expected.isObject() && keys(expected).equals(RESOURCES), "Inventário completo dos seis recursos é obrigatório");
        for (String resource : RESOURCES) {
            require(expected.path(resource).isArray(), "Coleção inválida: " + resource);
            Set<Long> ids = new HashSet<>();
            long previous = 0;
            for (JsonNode record : expected.path(resource)) {
                long id = record.path("id").asLong(-1);
                require(record.path("id").isIntegralNumber() && id > previous && ids.add(id), "IDs devem ser positivos, únicos e ordenados em " + resource);
                previous = id;
            }
        }
        JsonNode changes = manifest.path("changes");
        require(changes.isArray() && !changes.isEmpty(), "Lista de alterações obrigatória");
        ObjectNode desired = expected.deepCopy();
        Set<String> targets = new HashSet<>();
        for (JsonNode change : changes) {
            require(keys(change).equals(Set.of("resource", "id", "after")), "Alteração possui campos desconhecidos");
            String resource = change.path("resource").asText();
            long id = change.path("id").asLong(-1);
            require(change.path("id").isIntegralNumber() && id > 0, "ID de alteração inválido");
            require(RESOURCES.contains(resource) && !resource.equals("readings"), "Recurso não editável: " + resource);
            require(targets.add(resource + "/" + id), "Alvo duplicado");
            JsonNode after = change.path("after");
            require(after.isObject() && !after.isEmpty(), "Novos textos obrigatórios");
            Set<String> allowed = resource.equals("sensors") ? Set.of("name")
                : Set.of(resource.equals("events") || resource.equals("alerts") ? "title" : "name", "description");
            require(allowed.containsAll(keys(after)), "Somente os campos textuais são editáveis");
            ObjectNode record = find(desired.path(resource), id);
            after.fields().forEachRemaining(field -> {
                String key = field.getKey();
                JsonNode value = field.getValue();
                require(value.isTextual() && !value.asText().isBlank()
                    && value.asText().length() <= (key.equals("description") ? 500 : 100), "Texto inválido: " + key);
                require(record.has(key), "Campo ausente no registro original");
                record.set(key, value);
            });
        }
        ObjectNode current = snapshot();
        boolean alreadyApplied = same(current, desired);
        require(alreadyApplied || same(current, expected), "O banco diverge do inventário aprovado; nenhuma alteração foi aplicada");
        int changed = alreadyApplied ? 0 : changes.size();
        if (apply && !alreadyApplied) {
            for (JsonNode change : changes) update(change.path("resource").asText(), change.path("id").asLong(), change.path("after"));
            entityManager.flush();
            require(same(snapshot(), desired), "Verificação posterior falhou; transação revertida");
        }
        Map<String,Integer> totals = new TreeMap<>();
        RESOURCES.forEach(resource -> totals.put(resource, current.path(resource).size()));
        int total = totals.values().stream().mapToInt(Integer::intValue).sum();
        return new Report(!apply, alreadyApplied, changed, total - changed, totals, apply ? snapshot() : current);
    }

    @Transactional(readOnly=true)
    public ObjectNode snapshot() {
        Sort order = Sort.by("id").ascending();
        ObjectNode result = json.createObjectNode();
        result.set("modules", json.valueToTree(modules.findAll(order).stream().map(ComputingModuleResponse::from).toList()));
        result.set("sensors", json.valueToTree(sensors.findAll(order).stream().map(SensorResponse::from).toList()));
        result.set("systems", json.valueToTree(systems.findAll(order).stream().map(MonitoredSystemResponse::from).toList()));
        result.set("readings", json.valueToTree(readings.findAll(order).stream().map(SensorReadingResponse::from).toList()));
        result.set("events", json.valueToTree(events.findAll(order).stream().map(OperationalEventResponse::from).toList()));
        result.set("alerts", json.valueToTree(alerts.findAll(order).stream().map(CriticalAlertResponse::from).toList()));
        return result;
    }

    private void update(String resource, long id, JsonNode after) {
        // Entidades existentes e gerenciadas: nenhum INSERT, DELETE, ID ou vínculo é atribuído.
        switch (resource) {
            case "modules" -> { var item = modules.findById(id).orElseThrow(); if (after.has("name")) item.name=after.get("name").asText(); if (after.has("description")) item.description=after.get("description").asText(); }
            case "sensors" -> { var item = sensors.findById(id).orElseThrow(); item.name=after.get("name").asText(); }
            case "systems" -> { var item = systems.findById(id).orElseThrow(); if (after.has("name")) item.name=after.get("name").asText(); if (after.has("description")) item.description=after.get("description").asText(); }
            case "events" -> { var item = events.findById(id).orElseThrow(); if (after.has("title")) item.title=after.get("title").asText(); if (after.has("description")) item.description=after.get("description").asText(); }
            case "alerts" -> { var item = alerts.findById(id).orElseThrow(); if (after.has("title")) item.title=after.get("title").asText(); if (after.has("description")) item.description=after.get("description").asText(); }
            default -> throw new IllegalArgumentException("Recurso não editável");
        }
    }
    private static ObjectNode find(JsonNode records, long id) {
        for (JsonNode record : records) if (record.path("id").asLong() == id) return (ObjectNode) record;
        throw new IllegalArgumentException("ID ausente no inventário: " + id);
    }
    private static Set<String> keys(JsonNode node) { Set<String> keys=new HashSet<>(); node.fieldNames().forEachRemaining(keys::add); return keys; }
    public static boolean same(JsonNode first, JsonNode second) {
        return first.equals((a, b) -> a.isNumber() && b.isNumber() ? a.decimalValue().compareTo(b.decimalValue()) : a.equals(b) ? 0 : 1, second);
    }
    private static void require(boolean condition, String message) { if (!condition) throw new IllegalArgumentException(message); }
}
