package org.sync_astra.backendjava.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.sync_astra.backendjava.model.Categories.RelationShip;
import org.sync_astra.backendjava.util.DataEncrypt;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "Guardians")
@EntityListeners(AuditingEntityListener.class) // <- CRÍTICO para @CreatedDate y @LastModifiedDate
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guardians {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_guardian")
    private Long id;

    @UuidGenerator
    @Column(name = "uuid_guardian", nullable = false, unique = true, updatable = false)
    private UUID uuid;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "dni_guardian", nullable = false, unique = true)
    private String dni;


    @Convert(converter = DataEncrypt.class)
    @Column(name = "name_guardian", nullable = false)
    private String name;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "email_guardian", nullable = false)
    private String email;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "phone_guardian", nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship_guardian", nullable = false)
    private RelationShip relationship;

    @Column(name = "legal_representative_guardian", nullable = false)
    private boolean legalRepresentative;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_badge", nullable = false)
    private Badge badge;
}
