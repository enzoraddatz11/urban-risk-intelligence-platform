package br.com.fiap.spacemission.entities;
import jakarta.persistence.*;
@Entity
@Table(name="monitored_systems")
public class MonitoredSystem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    public Long id;
    public Long getId() { return id; }
    @Column(nullable=false, length=100)
    public String name;
    @Column(nullable=false, length=500)
    public String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false)
    public HealthStatus status;
    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="module_id", nullable=false)
    public ComputingModule module;
}
