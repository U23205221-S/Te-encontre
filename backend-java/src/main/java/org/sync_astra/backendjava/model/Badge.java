package org.sync_astra.backendjava.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.sync_astra.backendjava.model.Categories.Gender;
import org.sync_astra.backendjava.model.Categories.StatusBadge;
import org.sync_astra.backendjava.util.DataEncrypt;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "Badge")
@EntityListeners(AuditingEntityListener.class) // <- CRÍTICO para @CreatedDate y @LastModifiedDate
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_badge")
    private Long id;

    @Column(name = "uuid_badge", nullable = false, unique = true, updatable = false)
    @UuidGenerator
    private UUID uuid;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "dni_badge", nullable = false, unique = true)
    private String dni;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "full_name_badge", nullable = false)
    private String fullName;

    @Column(name = "date_of_birth_badge", nullable = false)
    private Instant dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender_badge", nullable = false)
    private Gender gender;

    @Column(name = "photo_url_badge", nullable = false)
    private String photoUrl;

    @Column(name = "face_vector_badge", nullable = false, columnDefinition = "vector(128)")
    @JdbcTypeCode(SqlTypes.VECTOR)
    private float[] faceVector;

    @Column(name = "status_badge", length = 50)
    @Enumerated(EnumType.STRING)
    private StatusBadge statusBadge;

    @Column(name = "consent_active")
    private Boolean consentActive;

    @Column(name = "consent_version", length = 20)
    private String consentVersion;

    @Column(name = "consent_accepted_at")
    private Instant consentAcceptedAt;

    @Column(name = "consent_revoked_at")
    private Instant consentRevokedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user_register", nullable = false)
    private Users userRegister;

    @OneToMany(mappedBy = "badge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Guardians> guardians;

    @OneToMany(mappedBy = "badge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScanAlert> scanAlerts;

    @OneToMany(mappedBy = "badge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BadgeQrCode> qrCodes;

    @OneToMany(mappedBy = "badge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ConsentAudit> consentAudits;
}
