package br.com.fiap.urbanrisk.entities;
/** Gravidade do risco, com pontuação de 0 a 100 usada na priorização. */
public enum Severity {
    BAIXA(25), MEDIA(50), ALTA(75), CRITICA(100);
    private final int points;
    Severity(int points) { this.points = points; }
    public int points() { return points; }
}
