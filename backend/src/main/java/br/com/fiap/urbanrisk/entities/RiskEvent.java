package br.com.fiap.urbanrisk.entities;
import jakarta.persistence.*;
@Entity
@Table(name="risk_events")
public class RiskEvent extends TrackedData {
    @Column(nullable=false, length=100)
    public String title;
    @Column(nullable=false, length=500)
    public String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    public RiskType type;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    public Severity severity;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    public EventStatus status;
    @Column(nullable=false)
    public java.time.Instant occurredAt;
    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="region_id", nullable=false)
    public Region region;
}
