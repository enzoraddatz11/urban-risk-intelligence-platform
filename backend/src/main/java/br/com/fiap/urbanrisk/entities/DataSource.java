package br.com.fiap.urbanrisk.entities;
/** Origem de um dado. O peso indica quanto a origem contribui para a confiança efetiva do alerta. */
public enum DataSource {
    SENSOR(1.0), BASE_PUBLICA(0.9), COMUNITARIO(0.6);
    private final double weight;
    DataSource(double weight) { this.weight = weight; }
    public double weight() { return weight; }
}
