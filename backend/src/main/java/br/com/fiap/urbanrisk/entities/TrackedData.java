package br.com.fiap.urbanrisk.entities;
import jakarta.persistence.*;
/** Todo registro informa de onde veio e o quanto se confia nele. */
@MappedSuperclass
public abstract class TrackedData {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    public Long id;
    public Long getId() { return id; }
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    public DataSource source;
    @Column(nullable=false)
    public Integer confidence;
}
