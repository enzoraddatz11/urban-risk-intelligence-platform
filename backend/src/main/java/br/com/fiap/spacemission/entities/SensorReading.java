package br.com.fiap.spacemission.entities;
import jakarta.persistence.*;
@Entity
@Table(name="sensor_readings")
public class SensorReading {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    public Long id;
    public Long getId() { return id; }
    @Column(name="reading_value", nullable=false, precision=18, scale=6)
    public java.math.BigDecimal value;
    @Column(nullable=false)
    public java.time.Instant recordedAt;
    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="sensor_id", nullable=false)
    public Sensor sensor;
}
