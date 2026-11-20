package org.sync_astra.backendjava.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.model.Categories.AlertStatus;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardianAlertDTO {
    private UUID alertUuid;
    private UUID badgeUuid;
    private String dependentFullName;
    private String dependentFirstName;
    private AlertStatus status;
    private LocalDateTime scannedAt;
    private Instant expiresAt;
    private Instant confirmedAt;
    private Instant escalatedAt;
    private Instant serverNow;
    private double latitude;
    private double longitude;
    private String googleMapsLink;
    private String photoReport;
    private String reporterName;
    private String reporterPhone;
    private boolean alreadyConfirmed;
}
