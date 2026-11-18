package br.com.fiap.urbanrisk.entities;
/** Faixa textual da confiança numérica (0 a 100). */
public enum ConfidenceLevel {
    ALTO, MEDIO, BAIXO;
    public static ConfidenceLevel of(int confidence) {
        return confidence >= 70 ? ALTO : confidence >= 40 ? MEDIO : BAIXO;
    }
}
