package br.com.fiap.urbanrisk.entities;
import jakarta.persistence.*;
/**
 * Relato de morador. Por desenho não guarda autor, contato, IP nem localização exata:
 * apenas a região, o tipo de risco, o texto (validado contra dados pessoais) e o horário.
 */
@Entity
@Table(name="community_reports")
public class CommunityReport extends TrackedData {
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    public RiskType riskType;
    @Column(nullable=false, length=500)
    public String description;
    @Column(nullable=false)
    public java.time.Instant occurredAt;
    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="region_id", nullable=false)
    public Region region;
}
