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
    private Long id;

    @Column(name = "uuid", nullable = false, unique = true, updatable = false)
    @UuidGenerator
    private UUID uuid;

    @Column(name = "full_name", nullable = false)
    @Convert(converter = DataEncrypt.class)
    private String fullName;

    @Column(name = "age")
    private int age;

    @Column(name = "gender", length = 10, nullable = false)
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(name = "blood_type", length = 5)
    @Convert(converter = DataEncrypt.class)
    private String bloodType;

    @Column(name = "allergies", length = 255)
    @Convert(converter = DataEncrypt.class)
    //Se asume que las alergias se almacenarán como una cadena de texto, posiblemente separada por comas si hay
    //múltiples alergias.
    //Si se requiere una estructura más compleja, se podría considerar una entidad separada para las alergias.
    private String allergies;

    @Column(name = "emergency_contact_name", length = 100)
    @Convert(converter = DataEncrypt.class)
    private String emergencyContactName;

    @Column(name = "main_emergency_phone", length = 50)
    @Convert(converter = DataEncrypt.class)
    private String mainEmergencyPhone;

    @Column(name = "alternative_emergency_phone", length = 50)
    @Convert(converter = DataEncrypt.class)
    private String alternativeEmergencyPhone;

    @Column(name = "photo", length = 255)
    private String photo;

    @Column(name = "status_badge", length = 50)
    @Enumerated(EnumType.STRING)
    private StatusBadge statusBadge;

    // Aquí está la magia:
    @Column(name = "face_vector", columnDefinition = "vector(128)")
    @JdbcTypeCode(SqlTypes.VECTOR)
    private float[] faceVector;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY) // O @OneToOne, dependiendo de la relación que quieras establecer
    @JoinColumn(name = "user_id") // Clave foránea que apunta a la
    private Users userParent; // Relación con la entidad Users, si es necesario. Se puede mapear con @ManyToOne o @OneToOne según el caso.

    @OneToMany(mappedBy = "badge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScanAlert> scanAlerts; // Relación con ScanAlert, un badge puede tener múltiples alertas de escaneo asociadas.
}
