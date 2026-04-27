package org.sync_astra.backendjava.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.sync_astra.backendjava.model.Categories.StatusEmail;
import org.sync_astra.backendjava.util.DataEncrypt;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_audit")
@EntityListeners(AuditingEntityListener.class) // <- CRÍTICO para @CreatedDate y @LastModifiedDate
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_notification_audit")
    private Long id;

    @UuidGenerator
    @Column(name = "uuid_notification_audit", nullable = false, unique = true, updatable = false)
    private UUID uuid;

    @Column(name = "entity", nullable = false, length = 50)
    private String entity; // Tipo de entidad (Badge, User, etc.)

    @Column(name = "entity_uuid", nullable = false, length = 50)
    private UUID entityUuid; // Tipo de entidad (Badge, User, etc.)

    @Convert(converter = DataEncrypt.class)
    @Column(name = "emailSend", nullable = false)
    private String emailSend; // Email al que se envió la notificación

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusEmail status; // Estado del envío (PENDIENTE, ENVIADO, FALLIDO, ENTREGADO)

    @Column(name = "provider_id")
    private String providerId; // ID de la notificación en el proveedor (Resend)

    @Column(name = "provider_name")
    private String providerName; // ID de la notificación en el proveedor (Resend)

    @LastModifiedDate
    @Column(name = "update_at", nullable = false)
    private Instant updateAt; // Fecha y hora del envío
}
