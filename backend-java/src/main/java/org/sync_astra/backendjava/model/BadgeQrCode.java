package org.sync_astra.backendjava.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.sync_astra.backendjava.model.Categories.QrCodeStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "badge_qr_codes")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeQrCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_badge_qr_code")
    private Long id;

    @Column(name = "qr_token", nullable = false, unique = true, updatable = false)
    private UUID qrToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private QrCodeStatus status;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "deactivated_at")
    private Instant deactivatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_badge", nullable = false)
    private Badge badge;
}
