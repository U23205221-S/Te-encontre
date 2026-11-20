package org.sync_astra.backendjava;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
import org.sync_astra.backendjava.dtos.request.GuardiansRequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.request.VerifyQrFaceRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.dtos.response.FamilyMemberSummaryDTO;
import org.sync_astra.backendjava.dtos.response.PublicQrCheckDTO;
import org.sync_astra.backendjava.dtos.response.VerifyQrFaceResponseDTO;
import org.sync_astra.backendjava.exceptions.QrRevokedException;
import org.sync_astra.backendjava.mapper.mapperImpl.BadgeMapper;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.BadgeQrCode;
import org.sync_astra.backendjava.model.Categories.Gender;
import org.sync_astra.backendjava.model.Categories.QrCodeStatus;
import org.sync_astra.backendjava.model.Categories.RelationShip;
import org.sync_astra.backendjava.model.ConsentAudit;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.BadgeQrCodeRepository;
import org.sync_astra.backendjava.repository.BadgeRepository;
import org.sync_astra.backendjava.repository.ConsentAuditRepository;
import org.sync_astra.backendjava.repository.UserRepository;
import org.sync_astra.backendjava.service.BadgeService;
import org.sync_astra.backendjava.service.ScanAlertService;
import org.sync_astra.backendjava.service.apiCloud.DniService;
import org.sync_astra.backendjava.service.cloudinary.ImageStorageService;
import org.sync_astra.backendjava.service.email.EmailOrchestratorService;
import org.sync_astra.backendjava.util.NameUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BadgeLifecycleAndPrivacyTest {

    @Mock private BadgeRepository badgeRepository;
    @Mock private BadgeQrCodeRepository badgeQrCodeRepository;
    @Mock private ConsentAuditRepository consentAuditRepository;
    @Mock private BadgeMapper badgeMapper;
    @Mock private UserRepository userRepository;
    @Mock private ScanAlertService scanAlertService;
    @Mock private ImageStorageService imageStorageService;
    @Mock private EmailOrchestratorService emailOrchestratorService;
    @Mock private DniService dniService;

    private BadgeService badgeService;
    private Users owner;
    private Badge dependentBadge;

    @BeforeEach
    void setUp() {
        badgeService = new BadgeService(
                badgeRepository,
                badgeQrCodeRepository,
                consentAuditRepository,
                badgeMapper,
                userRepository,
                scanAlertService,
                imageStorageService,
                emailOrchestratorService,
                dniService
        );

        owner = Users.builder()
                .id(1L)
                .uuid(UUID.randomUUID())
                .dni("12345678")
                .email("owner@example.com")
                .build();

        dependentBadge = Badge.builder()
                .id(10L)
                .uuid(UUID.randomUUID())
                .dni("87654321")
                .fullName("Lucia Torres Mendoza")
                .dateOfBirth(Instant.parse("2018-05-14T00:00:00Z"))
                .gender(Gender.FEMENINO)
                .photoUrl("https://cdn.example.com/lucia.jpg")
                .consentActive(true)
                .consentVersion("1.0")
                .consentAcceptedAt(Instant.now())
                .userRegister(owner)
                .guardians(new ArrayList<>())
                .qrCodes(new ArrayList<>())
                .build();
    }

    @Test
    void extractFirstName_returnsOnlyGivenFirstName() {
        assertEquals("Lucia", NameUtils.extractFirstName("Lucia Torres Mendoza"));
        assertEquals("Jose", NameUtils.extractFirstName("  Jose   Cubas "));
        assertEquals("Familiar", NameUtils.extractFirstName("   "));
        assertEquals("Familiar", NameUtils.extractFirstName(null));
    }

    @Test
    void createWithPhoto_rejectsRegistrationWithoutInformedConsent() {
        BadgeRequestDTO request = BadgeRequestDTO.builder()
                .dni("87654321")
                .fullName("Lucia Torres Mendoza")
                .dateOfBirth(Instant.parse("2018-05-14T00:00:00Z"))
                .gender(Gender.FEMENINO)
                .faceVector(new float[128])
                .consentAccepted(false)
                .guardians(List.of(
                        GuardiansRequestDTO.builder().dni("11111111").name("Ana").email("a@a.com").phone("999111222").relationship(RelationShip.MADRE).build(),
                        GuardiansRequestDTO.builder().dni("22222222").name("Luis").email("l@l.com").phone("999333444").relationship(RelationShip.PADRE).build()
                ))
                .build();

        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> badgeService.createWithPhoto(request, file, "12345678"));
        assertTrue(ex.getMessage().toLowerCase().contains("consentimiento"));
        verify(badgeRepository, never()).save(any());
    }

    @Test
    void createWithPhoto_persistsConsentVersionQrTokenAndAudit() throws Exception {
        BadgeRequestDTO request = BadgeRequestDTO.builder()
                .dni("87654321")
                .fullName("Lucia Torres Mendoza")
                .dateOfBirth(Instant.parse("2018-05-14T00:00:00Z"))
                .gender(Gender.FEMENINO)
                .faceVector(new float[128])
                .consentAccepted(true)
                .consentVersion("1.0")
                .guardians(List.of(
                        GuardiansRequestDTO.builder().dni("11111111").name("Ana").email("a@a.com").phone("999111222").relationship(RelationShip.MADRE).build(),
                        GuardiansRequestDTO.builder().dni("22222222").name("Luis").email("l@l.com").phone("999333444").relationship(RelationShip.PADRE).build()
                ))
                .build();

        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(dniService.existeDni(anyString())).thenReturn(true);
        when(userRepository.findByDni("12345678")).thenReturn(Optional.of(owner));
        when(imageStorageService.uploadImage(any(), anyString())).thenReturn("https://cdn.example.com/photo.jpg");
        when(badgeRepository.save(any(Badge.class))).thenAnswer(inv -> {
            Badge b = inv.getArgument(0);
            b.setId(99L);
            if (b.getUuid() == null) b.setUuid(UUID.randomUUID());
            return b;
        });
        when(badgeQrCodeRepository.save(any(BadgeQrCode.class))).thenAnswer(inv -> inv.getArgument(0));
        when(badgeMapper.toDTO(any(Badge.class))).thenReturn(BadgeResponseDTO.builder().uuid(UUID.randomUUID()).build());

        BadgeResponseDTO response = badgeService.createWithPhoto(request, file, "12345678");

        assertNotNull(response.getActiveQrToken());
        assertTrue(response.isConsentActive());
        assertEquals("1.0", response.getConsentVersion());
        verify(consentAuditRepository, times(1)).save(any(ConsentAudit.class));
        verify(badgeQrCodeRepository, times(1)).save(any(BadgeQrCode.class));
    }

    @Test
    void verifyFaceForQr_exposesOnlyFirstNameAndNeverFullName() {
        UUID qrToken = UUID.randomUUID();
        BadgeQrCode activeQr = BadgeQrCode.builder()
                .qrToken(qrToken)
                .status(QrCodeStatus.ACTIVE)
                .badge(dependentBadge)
                .build();

        when(badgeQrCodeRepository.findByQrToken(qrToken)).thenReturn(Optional.of(activeQr));
        BadgeRepository.BadgeMatchResult match = new BadgeRepository.BadgeMatchResult() {
            @Override public Long getId() { return 10L; }
            @Override public Double getDistance() { return 0.35; }
        };
        when(badgeRepository.findMatchByUuid(dependentBadge.getUuid(), new float[128])).thenReturn(Optional.of(match));

        VerifyQrFaceResponseDTO result = badgeService.verifyFaceForQr(
                VerifyQrFaceRequestDTO.builder().qrCodeUuid(qrToken).faceVector(new float[128]).build()
        );

        assertTrue(result.isVerified());
        assertEquals("Lucia", result.getFirstName());
        assertFalse(result.getMessage().contains("Torres"));
        assertFalse(result.getMessage().contains("Mendoza"));
    }

    @Test
    void revokedQr_isRejectedOnPublicCheckAndScan() {
        UUID revokedToken = UUID.randomUUID();
        BadgeQrCode revokedQr = BadgeQrCode.builder()
                .qrToken(revokedToken)
                .status(QrCodeStatus.REVOKED)
                .badge(dependentBadge)
                .build();

        when(badgeQrCodeRepository.findByQrToken(revokedToken)).thenReturn(Optional.of(revokedQr));

        PublicQrCheckDTO check = badgeService.checkPublicQr(revokedToken);
        assertFalse(check.isValid());
        assertNull(check.getFirstName());

        ScanAlertRequestDTO scanReq = ScanAlertRequestDTO.builder()
                .qrCodeUuid(revokedToken)
                .faceVector(new float[128])
                .latitude(-12.0)
                .longitude(-77.0)
                .nameDevice("Pixel")
                .ipAddress("127.0.0.1")
                .build();
        MockMultipartFile file = new MockMultipartFile("file", "scan.jpg", "image/jpeg", new byte[]{1});

        assertThrows(QrRevokedException.class, () -> badgeService.getByUuid(scanReq, file));
    }

    @Test
    void regenerateQr_revokesPreviousActiveQrAndCreatesNewOneForSameDependent() {
        UUID oldToken = UUID.randomUUID();
        BadgeQrCode oldQr = BadgeQrCode.builder()
                .id(1L)
                .qrToken(oldToken)
                .status(QrCodeStatus.ACTIVE)
                .createdAt(Instant.now().minusSeconds(60))
                .badge(dependentBadge)
                .build();

        when(badgeRepository.findByUuid(dependentBadge.getUuid())).thenReturn(Optional.of(dependentBadge));
        when(badgeQrCodeRepository.findByBadgeIdOrderByCreatedAtDesc(dependentBadge.getId()))
                .thenReturn(List.of(oldQr))
                .thenAnswer(inv -> {
                    BadgeQrCode latest = BadgeQrCode.builder()
                            .id(2L)
                            .qrToken(UUID.randomUUID())
                            .status(QrCodeStatus.ACTIVE)
                            .createdAt(Instant.now())
                            .badge(dependentBadge)
                            .build();
                    return List.of(latest, oldQr);
                });
        when(badgeQrCodeRepository.save(any(BadgeQrCode.class))).thenAnswer(inv -> inv.getArgument(0));

        FamilyMemberSummaryDTO summary = badgeService.regenerateQr(dependentBadge.getUuid(), "12345678");

        assertEquals(QrCodeStatus.REVOKED, oldQr.getStatus());
        assertNotNull(oldQr.getDeactivatedAt());
        assertEquals(QrCodeStatus.ACTIVE, summary.getQrStatus());
        assertNotNull(summary.getActiveQrToken());
        assertNotEquals(oldToken, summary.getActiveQrToken());
    }

    @Test
    void revokeConsent_deactivatesQrAndBlocksRegenerationUntilConsentGrantedAgain() {
        UUID activeToken = UUID.randomUUID();
        BadgeQrCode activeQr = BadgeQrCode.builder()
                .id(1L)
                .qrToken(activeToken)
                .status(QrCodeStatus.ACTIVE)
                .createdAt(Instant.now())
                .badge(dependentBadge)
                .build();

        when(badgeRepository.findByUuid(dependentBadge.getUuid())).thenReturn(Optional.of(dependentBadge));
        when(badgeQrCodeRepository.findByBadgeIdOrderByCreatedAtDesc(dependentBadge.getId())).thenReturn(List.of(activeQr));
        when(badgeRepository.save(any(Badge.class))).thenAnswer(inv -> inv.getArgument(0));
        when(badgeQrCodeRepository.save(any(BadgeQrCode.class))).thenAnswer(inv -> inv.getArgument(0));

        FamilyMemberSummaryDTO revoked = badgeService.revokeConsent(dependentBadge.getUuid(), "12345678");
        assertFalse(revoked.isConsentActive());
        assertEquals(QrCodeStatus.DEACTIVATED, activeQr.getStatus());
        assertNull(revoked.getActiveQrToken());

        assertThrows(IllegalStateException.class,
                () -> badgeService.regenerateQr(dependentBadge.getUuid(), "12345678"));

        FamilyMemberSummaryDTO granted = badgeService.grantConsent(dependentBadge.getUuid(), "1.0", "12345678");
        assertTrue(granted.isConsentActive());
        assertNull(granted.getActiveQrToken());
        verify(consentAuditRepository, times(2)).save(any(ConsentAudit.class));
    }

    @Test
    void manageBadge_deniesNonOwnerAccess() {
        when(badgeRepository.findByUuid(dependentBadge.getUuid())).thenReturn(Optional.of(dependentBadge));
        assertThrows(AccessDeniedException.class,
                () -> badgeService.deactivateQr(dependentBadge.getUuid(), "99999999"));
    }
}
