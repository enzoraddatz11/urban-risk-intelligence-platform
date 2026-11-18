package br.com.fiap.urbanrisk.entities;
import jakarta.persistence.*;
@Entity
@Table(name="sensors")
public class UrbanSensor extends TrackedData {
    @Column(nullable=false, length=100)
    public String name;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    public SensorType type;
    @Column(nullable=false, length=30)
    public String unit;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    public SensorStatus status;
    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="region_id", nullable=false)
    public Region region;
}
