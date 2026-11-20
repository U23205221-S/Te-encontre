package org.sync_astra.backendjava;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.sync_astra.backendjava.dtos.request.ScanAlertPart2RequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.response.GuardianAlertDTO;
import org.sync_astra.backendjava.dtos.response.PublicAssistanceDTO;
import org.sync_astra.backendjava.mapper.mapperImpl.BadgeMapper;
import org.sync_astra.backendjava.mapper.mapperImpl.ScanAlertMapper;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.Categories.AlertStatus;
import org.sync_astra.backendjava.model.Categories.RelationShip;
import org.sync_astra.backendjava.model.Guardians;
import org.sync_astra.backendjava.model.ScanAlert;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.ScanAlertRepository;
import org.sync_astra.backendjava.repository.UserRepository;
import org.sync_astra.backendjava.service.ScanAlertService;
import org.sync_astra.backendjava.service.apiCloud.DniService;
import org.sync_astra.backendjava.service.cloudinary.ImageStorageService;
import org.sync_astra.backendjava.service.email.EmailOrchestratorService;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertSosAndEscalationTest {

    @Mock private ScanAlertRepository scanAlertRepository;
    @Mock private EmailOrchestratorService emailOrchestratorService;
    @Mock private ScanAlertMapper scanAlertMapper;
    @Mock private ImageStorageService imageStorageService;
    @Mock private BadgeMapper badgeMapper;
    @Mock private DniService dniService;
    @Mock private UserRepository userRepository;

    private ScanAlertService scanAlertService;
    private Users owner;
    private Badge badge;
    private Guardians primary;
    private Guardians aux1;

    @BeforeEach
    void setUp() {
        scanAlertService = new ScanAlertService(
                scanAlertRepository,
                emailOrchestratorService,
                scanAlertMapper,
                imageStorageService,
                badgeMapper,
                dniService,
                userRepository
        );

        owner = Users.builder().id(1L).uuid(UUID.randomUUID()).dni("12345678").email("owner@example.com").build();
        primary = Guardians.builder()
                .id(1L).uuid(UUID.randomUUID()).name("Ana Torres").email("ana@example.com").phone("987654321")
                .relationship(RelationShip.MADRE).legalRepresentative(true).build();
        aux1 = Guardians.builder()
                .id(2L).uuid(UUID.randomUUID()).name("Carlos Perez").email("carlos@example.com").phone("912345678")
                .relationship(RelationShip.TIO).legalRepresentative(false).build();

        badge = Badge.builder()
                .id(10L).uuid(UUID.randomUUID()).dni("87654321").fullName("Lucia Torres Mendoza")
                .userRegister(owner)
                .guardians(List.of(primary, aux1))
                .build();
    }

    @Test
    void processAndSendAlert_notifiesOnlyPrimaryGuardianAndSets120sExpiry() throws Exception {
        ScanAlertRequestDTO request = ScanAlertRequestDTO.builder()
                .latitude(-12.0464).longitude(-77.0428).nameDevice("Chrome").ipAddress("127.0.0.1")
                .faceVector(new float[128]).build();
        MockMultipartFile file = new MockMultipartFile("file", "capture.jpg", "image/jpeg", new byte[]{1, 2});

        when(imageStorageService.uploadImage(any(), eq("reports"))).thenReturn("https://cdn.example.com/rep.jpg");
        when(scanAlertMapper.toModel(any())).thenReturn(new ScanAlert());
        when(scanAlertRepository.save(any(ScanAlert.class))).thenAnswer(inv -> {
            ScanAlert a = inv.getArgument(0);
            a.setId(100L);
            if (a.getUuid() == null) a.setUuid(UUID.randomUUID());
            return a;
        });

        UUID alertUuid = scanAlertService.processAndSendAlert(badge, file, request);

        assertNotNull(alertUuid);
        verify(emailOrchestratorService, times(1)).sendManageEmail(
                eq("GUARDIANS"), eq(primary.getUuid()), eq("ana@example.com"), anyString(),
                argThat(html -> html.contains("notificaciones?alert=") && !html.contains("tu-dominio.com")),
                eq("PRIMARY_GUARDIAN")
        );
        verify(emailOrchestratorService, never()).sendManageEmail(
                anyString(), any(), eq("carlos@example.com"), anyString(), anyString(), anyString()
        );
    }

    @Test
    void part2AndPublicStatus_hidePhoneNumbersAndExposesOnlyFirstNameUntilEscalated() {
        UUID alertUuid = UUID.randomUUID();
        ScanAlert activeAlert = ScanAlert.builder()
                .id(55L).uuid(alertUuid).badge(badge).status(AlertStatus.ACTIVE)
                .scannedAt(LocalDateTime.now()).expiresAt(Instant.now().plusSeconds(110))
                .latitude(-12.0).longitude(-77.0).build();

        when(scanAlertRepository.findByUuid(alertUuid)).thenReturn(Optional.of(activeAlert));
        when(scanAlertRepository.save(any(ScanAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        PublicAssistanceDTO dto = scanAlertService.processAndSendAlertPart2(alertUuid, new ScanAlertPart2RequestDTO());

        assertEquals("Lucia", dto.getFirstName());
        assertEquals("ACTIVE", dto.getAlertStatus());
        assertNotNull(dto.getPrimaryContact());
        assertEquals("Apoderado Titular", dto.getPrimaryContact().getLabel());
        assertEquals("tel:987654321", dto.getPrimaryContact().getTelUri());
        assertTrue(dto.getAuxiliaryContacts().isEmpty());
        assertNull(dto.getEmergencyLineUri());

        activeAlert.setStatus(AlertStatus.ESCALATED);
        activeAlert.setEscalatedAt(Instant.now());
        PublicAssistanceDTO escalated = scanAlertService.getPublicAlertStatus(alertUuid);

        assertEquals(1, escalated.getAuxiliaryContacts().size());
        assertEquals("Apoderado Auxiliar 1", escalated.getAuxiliaryContacts().get(0).getLabel());
        assertEquals("tel:912345678", escalated.getAuxiliaryContacts().get(0).getTelUri());
        assertEquals("tel:114", escalated.getEmergencyLineUri());
    }

    @Test
    void confirmAlert_marksConfirmedAtomicallyAndPreventsDuplicateEscalation() {
        UUID alertUuid = UUID.randomUUID();
        UUID token = UUID.randomUUID();
        ScanAlert activeAlert = ScanAlert.builder()
                .id(55L).uuid(alertUuid).confirmationToken(token).badge(badge)
                .status(AlertStatus.ACTIVE).scannedAt(LocalDateTime.now()).expiresAt(Instant.now().plusSeconds(90))
                .latitude(-12.0).longitude(-77.0).build();

        when(scanAlertRepository.findByUuid(alertUuid)).thenReturn(Optional.of(activeAlert));
        when(scanAlertRepository.markConfirmedIfConfirmable(
                eq(alertUuid),
                eq(List.of(AlertStatus.ACTIVE, AlertStatus.ESCALATED)),
                eq(AlertStatus.CONFIRMED),
                any(),
                eq("12345678")
        )).thenReturn(1);

        GuardianAlertDTO result = scanAlertService.confirmAlert(alertUuid, null, "12345678");

        assertEquals(AlertStatus.CONFIRMED, result.getStatus());
        assertNotNull(result.getConfirmedAt());
        assertFalse(result.isAlreadyConfirmed());
    }

    @Test
    void confirmAlert_allowsConfirmingAfterEscalationAndRefreshesStaleStateOnRace() {
        UUID alertUuid = UUID.randomUUID();
        UUID token = UUID.randomUUID();
        ScanAlert escalated = ScanAlert.builder()
                .id(56L).uuid(alertUuid).confirmationToken(token).badge(badge)
                .status(AlertStatus.ESCALATED).scannedAt(LocalDateTime.now()).expiresAt(Instant.now().minusSeconds(5))
                .latitude(-12.0).longitude(-77.0).build();

        ScanAlert alreadyConfirmedInDb = ScanAlert.builder()
                .id(56L).uuid(alertUuid).confirmationToken(token).badge(badge)
                .status(AlertStatus.CONFIRMED).confirmedAt(Instant.now()).build();

        when(scanAlertRepository.findByUuid(alertUuid))
                .thenReturn(Optional.of(escalated))
                .thenReturn(Optional.of(alreadyConfirmedInDb));
        when(scanAlertRepository.markConfirmedIfConfirmable(
                eq(alertUuid),
                eq(List.of(AlertStatus.ACTIVE, AlertStatus.ESCALATED)),
                eq(AlertStatus.CONFIRMED),
                any(),
                eq("TOKEN_LINK")
        )).thenReturn(0);

        GuardianAlertDTO result = scanAlertService.confirmAlert(alertUuid, token, null);

        assertEquals(AlertStatus.CONFIRMED, result.getStatus());
        assertTrue(result.isAlreadyConfirmed());
    }

    @Test
    void confirmAlert_rejectsUnauthorizedUserWithoutMatchingToken() {
        UUID alertUuid = UUID.randomUUID();
        ScanAlert activeAlert = ScanAlert.builder()
                .id(55L).uuid(alertUuid).confirmationToken(UUID.randomUUID()).badge(badge)
                .status(AlertStatus.ACTIVE).build();
        when(scanAlertRepository.findByUuid(alertUuid)).thenReturn(Optional.of(activeAlert));

        assertThrows(AccessDeniedException.class,
                () -> scanAlertService.confirmAlert(alertUuid, UUID.randomUUID(), "99999999"));
    }

    @Test
    void processExpiredAlerts_escalatesOnceAndNotifiesAuxiliaryGuardiansOnly() {
        UUID alertUuid = UUID.randomUUID();
        ScanAlert expired = ScanAlert.builder()
                .id(77L).uuid(alertUuid).badge(badge).status(AlertStatus.ACTIVE)
                .scannedAt(LocalDateTime.now().minusSeconds(130))
                .expiresAt(Instant.now().minusSeconds(10))
                .latitude(-12.0464).longitude(-77.0428)
                .photoReport("https://cdn.example.com/rep.jpg")
                .build();

        when(scanAlertRepository.findExpiredActiveAlerts(eq(AlertStatus.ACTIVE), any())).thenReturn(List.of(expired));
        when(scanAlertRepository.markEscalatedIfActive(eq(77L), eq(AlertStatus.ACTIVE), eq(AlertStatus.ESCALATED), any()))
                .thenReturn(1)
                .thenReturn(0);

        int firstPass = scanAlertService.processExpiredAlerts();
        int secondPass = scanAlertService.processExpiredAlerts();

        assertEquals(1, firstPass);
        assertEquals(0, secondPass);
        verify(emailOrchestratorService, times(1)).sendManageEmail(
                eq("GUARDIANS"), eq(aux1.getUuid()), eq("carlos@example.com"), anyString(), anyString(), eq("AUXILIARY_GUARDIAN")
        );
        verify(emailOrchestratorService, never()).sendManageEmail(
                anyString(), any(), eq("ana@example.com"), anyString(), anyString(), eq("AUXILIARY_GUARDIAN")
        );
    }
}
