package org.sync_astra.backendjava.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Privacy-minimized response for public citizen assistance views (US-08).
 * Exposes only the dependent's first name and generic contact actions without PII.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicAssistanceDTO {
    private UUID alertUuid;
    private String firstName;
    private String alertStatus;
    private Instant scannedAt;
    private Instant expiresAt;
    private Instant confirmedAt;
    private Instant serverNow;
    private PublicContactDTO primaryContact;
    private List<PublicContactDTO> auxiliaryContacts;
    private String emergencyLineUri;
}
