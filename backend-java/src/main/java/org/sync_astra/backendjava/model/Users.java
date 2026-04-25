package org.sync_astra.backendjava.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.sync_astra.backendjava.util.DataEncrypt;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "Users")
@EntityListeners(AuditingEntityListener.class) // <- CRÍTICO para @CreatedDate y @LastModifiedDate
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_user")
    private Long id;

    @UuidGenerator
    @Column(name = "uuid_user", nullable = false, unique = true, updatable = false)
    private UUID uuid;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "dni", nullable = false, unique = true)
    private String dni;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "userRegister", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Badge> badges;

    @OneToMany(mappedBy = "scanByUser", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScanAlert> scanAlerts;
}
