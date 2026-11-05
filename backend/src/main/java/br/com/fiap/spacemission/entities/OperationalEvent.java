package br.com.fiap.spacemission.entities;
import jakarta.persistence.*;
@Entity
@Table(name="events")
public class OperationalEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    public Long id;
    public Long getId() { return id; }
    @Column(nullable=false, length=100)
    public String title;
    @Column(nullable=false, length=500)
    public String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false)
    public Severity severity;
    @Column(nullable=false)
    public java.time.Instant occurredAt;
    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="system_id", nullable=false)
    public MonitoredSystem system;
}
