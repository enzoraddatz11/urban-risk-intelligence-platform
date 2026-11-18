package br.com.fiap.urbanrisk.entities;
import jakarta.persistence.*;
@Entity
@Table(name="regions")
public class Region extends TrackedData {
    @Column(nullable=false, length=100)
    public String name;
    @Column(nullable=false, length=100)
    public String city;
    @Column(nullable=false, length=500)
    public String description;
    @Column(nullable=false)
    public Double latitude;
    @Column(nullable=false)
    public Double longitude;
}
