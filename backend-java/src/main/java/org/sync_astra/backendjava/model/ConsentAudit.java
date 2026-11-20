package org.sync_astra.backendjava.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.sync_astra.backendjava.model.Categories.ConsentAction;
import org.sync_astra.backendjava.util.DataEncrypt;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "consent_audit")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_consent_audit")
    private Long id;

    @UuidGenerator
    @Column(name = "uuid", nullable = false, unique = true, updatable = false)
    private UUID uuid;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private ConsentAction action;

    @Column(name = "consent_version", nullable = false, length = 20)
    private String consentVersion;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "actor_dni", nullable = false)
    private String actorDni;

    @CreatedDate
    @Column(name = "acted_at", nullable = false, updatable = false)
    private Instant actedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_badge", nullable = false)
    private Badge badge;
}
