package br.com.fiap.urbanrisk.config;
import br.com.fiap.urbanrisk.entities.*;
import br.com.fiap.urbanrisk.repositories.*;
import br.com.fiap.urbanrisk.services.ReportService;
import java.math.BigDecimal;
import java.time.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dados SIMULADOS da cidade fictícia de Nova Ribeira. Os horários são relativos ao momento da primeira
 * inicialização, para que a demonstração já comece com alertas recentes. Só é executado em banco vazio.
 */
@Component
@ConditionalOnProperty(name="app.seed-enabled", havingValue="true")
public class SeedData implements ApplicationRunner {
    public static final String CITY = "Nova Ribeira (simulada)";
    private final RegionRepository regions;
    private final UrbanSensorRepository sensors;
    private final SensorReadingRepository readings;
    private final RiskEventRepository events;
    private final CommunityReportRepository reports;
    private final Clock clock;
    private Instant now;

    public SeedData(RegionRepository regions, UrbanSensorRepository sensors, SensorReadingRepository readings,
            RiskEventRepository events, CommunityReportRepository reports, Clock clock) {
        this.regions = regions; this.sensors = sensors; this.readings = readings; this.events = events; this.reports = reports; this.clock = clock;
    }

    @Override @Transactional
    public void run(ApplicationArguments args) {
        // Inicializa apenas um banco completamente vazio; a transação evita carga parcial.
        if (regions.count() + sensors.count() + readings.count() + events.count() + reports.count() != 0) return;
        now = clock.instant();

        Region varzea = region("Várzea do Ribeirão", "Bairro às margens do Ribeirão Claro, com histórico de alagamentos em chuvas fortes.", -23.5480, -46.6010);
        Region centro = region("Centro Histórico", "Área densamente construída e pouco arborizada, sujeita a ilhas de calor.", -23.5410, -46.6330);
        Region palmeiras = region("Jardim das Palmeiras", "Bairro residencial arborizado, com drenagem antiga em algumas ruas.", -23.5600, -46.6550);
        Region industrial = region("Parque Industrial", "Polo de fábricas atendido pela subestação de energia Leste.", -23.5280, -46.5800);
        Region morro = region("Morro Alto", "Bairro em área elevada, abastecido por um reservatório próprio.", -23.5720, -46.6200);

        UrbanSensor pluviometro = sensor("Pluviômetro da Várzea", SensorType.PLUVIOMETRO, "mm/h", SensorStatus.OPERANTE, varzea, DataSource.SENSOR, 92);
        UrbanSensor regua = sensor("Régua do Ribeirão Claro", SensorType.NIVEL_RIO, "m", SensorStatus.OPERANTE, varzea, DataSource.SENSOR, 90);
        UrbanSensor termoCentro = sensor("Termômetro da Praça Central", SensorType.TEMPERATURA, "°C", SensorStatus.OPERANTE, centro, DataSource.SENSOR, 88);
        UrbanSensor termoPalmeiras = sensor("Termômetro do Jardim das Palmeiras", SensorType.TEMPERATURA, "°C", SensorStatus.OPERANTE, palmeiras, DataSource.SENSOR, 85);
        UrbanSensor energia = sensor("Tensão da Subestação Leste", SensorType.ENERGIA, "kV", SensorStatus.INSTAVEL, industrial, DataSource.BASE_PUBLICA, 75);
        UrbanSensor agua = sensor("Pressão da rede do Morro Alto", SensorType.AGUA, "mca", SensorStatus.OFFLINE, morro, DataSource.BASE_PUBLICA, 70);

        series(pluviometro, Duration.ofMinutes(15), "12", "28", "46", "61");
        series(regua, Duration.ofMinutes(15), "2.1", "2.6", "3.2", "3.8");
        series(termoCentro, Duration.ofMinutes(30), "31.5", "33.8", "35.9", "37.2");
        series(termoPalmeiras, Duration.ofMinutes(30), "27.0", "28.1", "28.9", "29.4");
        series(energia, Duration.ofHours(2), "13.8", "13.6", "9.2", "0");
        series(agua, Duration.ofHours(30), "18", "15", "9", "4");

        event("Ribeirão Claro acima da cota de alerta", "Nível do ribeirão subiu 1,7 m em uma hora com chuva intensa. Risco de transbordamento nas ruas baixas.",
                RiskType.ALAGAMENTO, Severity.CRITICA, EventStatus.ATIVO, Duration.ofMinutes(20), varzea, DataSource.SENSOR, 90);
        event("Temperatura extrema no Centro Histórico", "Termômetro urbano registra 37 °C, cerca de 8 °C acima dos bairros arborizados vizinhos.",
                RiskType.ILHA_DE_CALOR, Severity.ALTA, EventStatus.ATIVO, Duration.ofMinutes(40), centro, DataSource.SENSOR, 85);
        event("Queda de tensão na Subestação Leste", "A concessionária informa desligamento parcial no Parque Industrial, sem previsão de retorno.",
                RiskType.FALTA_DE_ENERGIA, Severity.ALTA, EventStatus.ATIVO, Duration.ofHours(2), industrial, DataSource.BASE_PUBLICA, 80);
        event("Baixa pressão na rede do Morro Alto", "Boletim público aponta manutenção no reservatório e abastecimento intermitente.",
                RiskType.FALTA_DE_AGUA, Severity.MEDIA, EventStatus.ATIVO, Duration.ofHours(6), morro, DataSource.BASE_PUBLICA, 65);
        event("Bolsão de água na Rua das Palmeiras", "Moradores relatam acúmulo de água em um trecho da rua após a chuva.",
                RiskType.ALAGAMENTO, Severity.BAIXA, EventStatus.ATIVO, Duration.ofHours(1), palmeiras, DataSource.COMUNITARIO, 40);
        event("Onda de calor encerrada", "Temperaturas voltaram à média histórica após a passagem de uma frente fria.",
                RiskType.ILHA_DE_CALOR, Severity.MEDIA, EventStatus.ENCERRADO, Duration.ofDays(3), palmeiras, DataSource.BASE_PUBLICA, 80);

        report(varzea, RiskType.ALAGAMENTO, "Água na altura da canela na avenida principal.", Duration.ofMinutes(10));
        report(varzea, RiskType.ALAGAMENTO, "Bueiros transbordando perto da escola municipal.", Duration.ofMinutes(25));
        report(varzea, RiskType.ALAGAMENTO, "Córrego subindo rápido depois da chuva forte.", Duration.ofMinutes(50));
        report(centro, RiskType.ILHA_DE_CALOR, "Calor muito forte no ponto de ônibus da praça, sem sombra.", Duration.ofMinutes(35));
        report(centro, RiskType.ILHA_DE_CALOR, "Idosos passando mal com o calor na feira livre.", Duration.ofHours(1));
        report(industrial, RiskType.FALTA_DE_ENERGIA, "Semáforos apagados no cruzamento das fábricas.", Duration.ofHours(1));
        report(morro, RiskType.FALTA_DE_AGUA, "Torneiras sem água desde o início da manhã.", Duration.ofHours(5));
        report(morro, RiskType.FALTA_DE_AGUA, "Caixa d'água do prédio vazia, água volta fraca à noite.", Duration.ofHours(8));
        report(morro, RiskType.FALTA_DE_AGUA, "Escola do bairro suspendeu o almoço por falta de água.", Duration.ofHours(12));
        report(palmeiras, RiskType.ALAGAMENTO, "Poça grande na esquina, carros desviando pela calçada.", Duration.ofMinutes(55));
    }

    private Region region(String name, String description, double latitude, double longitude) {
        Region r = new Region();
        r.name = name; r.city = CITY; r.description = description; r.latitude = latitude; r.longitude = longitude;
        r.source = DataSource.BASE_PUBLICA; r.confidence = 95;
        return regions.save(r);
    }
    private UrbanSensor sensor(String name, SensorType type, String unit, SensorStatus status, Region region, DataSource source, int confidence) {
        UrbanSensor s = new UrbanSensor();
        s.name = name; s.type = type; s.unit = unit; s.status = status; s.region = region; s.source = source; s.confidence = confidence;
        return sensors.save(s);
    }
    /** Grava os valores em ordem cronológica, a cada 15 minutos, terminando em {@code lastAgo} antes de agora. */
    private void series(UrbanSensor sensor, Duration lastAgo, String... values) {
        for (int i = 0; i < values.length; i++) {
            SensorReading r = new SensorReading();
            r.sensor = sensor; r.value = new BigDecimal(values[i]);
            r.recordedAt = now.minus(lastAgo).minus(Duration.ofMinutes(15L * (values.length - 1 - i)));
            r.source = sensor.source; r.confidence = sensor.confidence;
            readings.save(r);
        }
    }
    private void event(String title, String description, RiskType type, Severity severity, EventStatus status, Duration ago,
            Region region, DataSource source, int confidence) {
        RiskEvent e = new RiskEvent();
        e.title = title; e.description = description; e.type = type; e.severity = severity; e.status = status;
        e.occurredAt = now.minus(ago); e.region = region; e.source = source; e.confidence = confidence;
        events.save(e);
    }
    private void report(Region region, RiskType type, String description, Duration ago) {
        CommunityReport c = new CommunityReport();
        c.region = region; c.riskType = type; c.description = description; c.occurredAt = now.minus(ago);
        c.source = DataSource.COMUNITARIO; c.confidence = ReportService.COMMUNITY_CONFIDENCE;
        reports.save(c);
    }
}
