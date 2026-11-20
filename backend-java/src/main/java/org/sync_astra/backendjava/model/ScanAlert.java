package org.sync_astra.backendjava.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.sync_astra.backendjava.model.Categories.AlertStatus;
import org.sync_astra.backendjava.util.DataEncrypt;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "scan_alerts")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_scan_alert")
    private Long id;

    @UuidGenerator
    @Column(name = "uuid", nullable = false, unique = true, updatable = false)
    private UUID uuid;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "dni_reporter", nullable = false)
    private String dniReporter;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "full_name_reporter", nullable = false)
    private String fullNameReporter;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "phone_reporter", nullable = false)
    private String phoneReporter;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "name_device", nullable = false)
    private String nameDevice;

    @Column(name = "photo_report", nullable = false)
    private String photoReport;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    @CreatedDate
    @Column(name = "scanned_at", nullable = false, updatable = false)
    private LocalDateTime scannedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private AlertStatus status;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Convert(converter = DataEncrypt.class)
    @Column(name = "confirmed_by_dni")
    private String confirmedByDni;

    @Column(name = "escalated_at")
    private Instant escalatedAt;

    @Column(name = "confirmation_token", unique = true)
    private UUID confirmationToken;

    @Column(name = "gps_accuracy_meters")
    private Double gpsAccuracyMeters;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_badge", nullable = false)
    private Badge badge;
}
