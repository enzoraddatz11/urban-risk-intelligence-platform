package br.com.fiap.urbanrisk.entities;
import java.util.Set;
/** Tipos de risco urbano e os sensores cujas leituras indicam a atualidade do monitoramento. */
public enum RiskType {
    ALAGAMENTO(Set.of(SensorType.PLUVIOMETRO, SensorType.NIVEL_RIO)),
    ILHA_DE_CALOR(Set.of(SensorType.TEMPERATURA)),
    FALTA_DE_ENERGIA(Set.of(SensorType.ENERGIA)),
    FALTA_DE_AGUA(Set.of(SensorType.AGUA));
    private final Set<SensorType> relatedSensors;
    RiskType(Set<SensorType> relatedSensors) { this.relatedSensors = relatedSensors; }
    public Set<SensorType> relatedSensors() { return relatedSensors; }
}
