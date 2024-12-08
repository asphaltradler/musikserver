package com.cosmaslang.musicdataserver.db.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.util.Set;

@Entity
@Table(indexes = @Index(columnList = "name", unique = true))
public class Work extends NamedEntity {
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Id
    long id;

    //muss man leider hier drin definieren, sonst wird es nicht gefunden
    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "work", fetch = FetchType.LAZY)
    @JsonBackReference
    private Set<Track> tracks;

    @Override
    public String getName() {
        return name;
    }

    @Override
    public long getId() {
        return id;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }
}
