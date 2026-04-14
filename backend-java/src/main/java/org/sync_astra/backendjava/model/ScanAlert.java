package org.sync_astra.backendjava.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

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
    private Long id;

    @Column(nullable = false)
    private String qrCodeId;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime scannedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean emailSent = false;

    @Column(name = "email_error_log", columnDefinition = "TEXT")
    private String emailErrorLog;
}
