package org.sync_astra.backendjava.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.model.Categories.Gender;
import org.sync_astra.backendjava.model.Categories.QrCodeStatus;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberSummaryDTO {
    private UUID badgeUuid;
    private String fullName;
    private String firstName;
    private String maskedDni;
    private Instant dateOfBirth;
    private Gender gender;
    private String photoUrl;
    private int guardiansCount;

    private UUID activeQrToken;
    private UUID latestQrToken;
    private QrCodeStatus qrStatus;

    private boolean consentActive;
    private String consentVersion;
    private Instant consentAcceptedAt;
    private Instant consentRevokedAt;
}
