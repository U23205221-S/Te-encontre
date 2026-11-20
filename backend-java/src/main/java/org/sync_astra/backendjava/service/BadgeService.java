package org.sync_astra.backendjava.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
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
import org.sync_astra.backendjava.model.Categories.ConsentAction;
import org.sync_astra.backendjava.model.Categories.QrCodeStatus;
import org.sync_astra.backendjava.model.Categories.StatusBadge;
import org.sync_astra.backendjava.model.ConsentAudit;
import org.sync_astra.backendjava.model.Guardians;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.BadgeQrCodeRepository;
import org.sync_astra.backendjava.repository.BadgeRepository;
import org.sync_astra.backendjava.repository.ConsentAuditRepository;
import org.sync_astra.backendjava.repository.UserRepository;
import org.sync_astra.backendjava.service.apiCloud.DniService;
import org.sync_astra.backendjava.service.cloudinary.ImageStorageService;
import org.sync_astra.backendjava.service.email.EmailOrchestratorService;
import org.sync_astra.backendjava.util.NameUtils;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class BadgeService {
    private final BadgeRepository badgeRepository;
    private final BadgeQrCodeRepository badgeQrCodeRepository;
    private final ConsentAuditRepository consentAuditRepository;
    private final BadgeMapper badgeMapper;
    private final UserRepository userRepository;
    private final ScanAlertService scanAlertService;
    private static final double MATCH_THRESHOLD = 0.6;
    private static final String DEFAULT_CONSENT_VERSION = "1.0";
    private final ImageStorageService imageStorageService;
    private final EmailOrchestratorService emailOrchestratorService;
    private final DniService dniService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl = "http://localhost:5173";

    @Transactional
    public UUID identifyByFace(ScanAlertRequestDTO requestDTO, MultipartFile file) {
        return badgeRepository.findBestMatch(requestDTO.getFaceVector())
                .filter(result -> result.getDistance() < MATCH_THRESHOLD)
                .flatMap(result -> badgeRepository.findById(result.getId()))
                .filter(badge -> !Boolean.FALSE.equals(badge.getConsentActive()))
                .map(badge -> scanAlertService.processAndSendAlert(badge, file, requestDTO))
                .orElseThrow(() -> new EntityNotFoundException("No se encontró ninguna coincidencia biométrica que supere el umbral mínimo."));
    }

    @Transactional(readOnly = true)
    public VerifyQrFaceResponseDTO verifyFaceForQr(VerifyQrFaceRequestDTO requestDTO) {
        Badge badge = resolveBadgeByQrToken(requestDTO.getQrCodeUuid());

        Optional<BadgeRepository.BadgeMatchResult> match = badgeRepository.findMatchByUuid(
                badge.getUuid(),
                requestDTO.getFaceVector()
        );

        boolean isMatch = match.map(r -> r.getDistance() < MATCH_THRESHOLD).orElse(false);

        if (isMatch) {
            String firstName = NameUtils.extractFirstName(badge.getFullName());
            return VerifyQrFaceResponseDTO.builder()
                    .verified(true)
                    .firstName(firstName)
                    .message("Rostro verificado: corresponde a " + firstName + ".")
                    .build();
        }

        return VerifyQrFaceResponseDTO.builder()
                .verified(false)
                .firstName(null)
                .message("El rostro de la foto no coincide con el familiar registrado en este código QR.")
                .build();
    }

    @Transactional
    public UUID getByUuid(ScanAlertRequestDTO requestDTO, MultipartFile file) {
        Badge badge = resolveBadgeByQrToken(requestDTO.getQrCodeUuid());

        badgeRepository.findMatchByUuid(badge.getUuid(), requestDTO.getFaceVector())
                .filter(r -> r.getDistance() < MATCH_THRESHOLD)
                .orElseThrow(() -> new IllegalArgumentException("El rostro de la foto no coincide con el familiar registrado en este código QR."));

        return scanAlertService.processAndSendAlert(badge, file, requestDTO);
    }

    @Transactional(readOnly = true)
    public PublicQrCheckDTO checkPublicQr(UUID qrToken) {
        try {
            Badge badge = resolveBadgeByQrToken(qrToken);
            return PublicQrCheckDTO.builder()
                    .valid(true)
                    .firstName(NameUtils.extractFirstName(badge.getFullName()))
                    .message("Código QR válido.")
                    .build();
        } catch (QrRevokedException | EntityNotFoundException ex) {
            return PublicQrCheckDTO.builder()
                    .valid(false)
                    .firstName(null)
                    .message(ex.getMessage())
                    .build();
        }
    }

    public BadgeResponseDTO getBadgeByUuid(String uuid) {
        Badge badge = badgeRepository.findByUuid(UUID.fromString(uuid))
                .orElseThrow(() -> new EntityNotFoundException("Badge no encontrado para el UUID: " + uuid));
        BadgeResponseDTO dto = badgeMapper.toDTO(badge);
        enrichBadgeResponse(dto, badge, resolveActiveQrToken(badge));
        return dto;
    }

    @Transactional
    public BadgeResponseDTO createWithPhoto(BadgeRequestDTO requestDTO, MultipartFile file, String registerUserName) {
        if (!Boolean.TRUE.equals(requestDTO.getConsentAccepted())) {
            throw new IllegalArgumentException("Debe aceptar el consentimiento informado de privacidad antes de completar el registro.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("La imagen no puede estar vacía.");
        }
        validarDnis(requestDTO);

        Users userRegister = userRepository.findByDni(registerUserName)
                .orElseThrow(() -> new EntityNotFoundException("Usuario en sesión no encontrado en la BD"));

        String photoUrl;
        try {
            photoUrl = imageStorageService.uploadImage(file, "badges");
        } catch (IOException e) {
            log.error("Fallo crítico al subir archivo a la nube: {}", e.getMessage());
            throw new RuntimeException("Error en el sistema de almacenamiento en la nube.");
        }

        String consentVersion = StringUtils.hasText(requestDTO.getConsentVersion())
                ? requestDTO.getConsentVersion().trim()
                : DEFAULT_CONSENT_VERSION;
        Instant now = Instant.now();

        requestDTO.setPhotoUrl(photoUrl);
        requestDTO.setStatusBadge(StatusBadge.NEUTRAL);

        Badge badge = new Badge();
        badgeMapper.updateFromDto(requestDTO, badge);
        badge.setUserRegister(userRegister);
        badge.setConsentActive(true);
        badge.setConsentVersion(consentVersion);
        badge.setConsentAcceptedAt(now);
        badge.setConsentRevokedAt(null);

        if (badge.getGuardians() != null) {
            for (int i = 0; i < badge.getGuardians().size(); i++) {
                Guardians guardian = badge.getGuardians().get(i);
                guardian.setBadge(badge);
                guardian.setLegalRepresentative(i == 0);
            }
        }

        Badge savedBadge = badgeRepository.save(badge);
        BadgeQrCode initialQr = badgeQrCodeRepository.save(BadgeQrCode.builder()
                .qrToken(UUID.randomUUID())
                .status(QrCodeStatus.ACTIVE)
                .createdAt(now)
                .badge(savedBadge)
                .build());
        recordConsentAudit(savedBadge, ConsentAction.GRANTED, consentVersion, registerUserName, now);

        log.info("Nuevo Badge registrado con éxito. UUID: {}, QR Token: {}", savedBadge.getUuid(), initialQr.getQrToken());

        enviarCorreosNotificacion(savedBadge, initialQr.getQrToken());

        BadgeResponseDTO dto = badgeMapper.toDTO(savedBadge);
        enrichBadgeResponse(dto, savedBadge, initialQr.getQrToken());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<FamilyMemberSummaryDTO> getMyFamilies(String ownerDni) {
        Users owner = userRepository.findByDni(ownerDni)
                .orElseThrow(() -> new EntityNotFoundException("Usuario en sesión no encontrado en la BD"));

        return badgeRepository.findByUserRegisterOrderByCreatedAtDesc(owner)
                .stream()
                .map(this::toFamilySummary)
                .toList();
    }

    @Transactional
    public FamilyMemberSummaryDTO deactivateQr(UUID badgeUuid, String ownerDni) {
        Badge badge = loadOwnedBadge(badgeUuid, ownerDni);
        deactivateActiveQrTokens(badge.getId(), QrCodeStatus.DEACTIVATED);
        return toFamilySummary(badge);
    }

    @Transactional
    public FamilyMemberSummaryDTO regenerateQr(UUID badgeUuid, String ownerDni) {
        Badge badge = loadOwnedBadge(badgeUuid, ownerDni);
        if (Boolean.FALSE.equals(badge.getConsentActive())) {
            throw new IllegalStateException("Debes otorgar un nuevo consentimiento informado antes de regenerar el código QR.");
        }

        deactivateActiveQrTokens(badge.getId(), QrCodeStatus.REVOKED);
        badgeQrCodeRepository.save(BadgeQrCode.builder()
                .qrToken(UUID.randomUUID())
                .status(QrCodeStatus.ACTIVE)
                .createdAt(Instant.now())
                .badge(badge)
                .build());

        return toFamilySummary(badge);
    }

    @Transactional
    public FamilyMemberSummaryDTO revokeConsent(UUID badgeUuid, String ownerDni) {
        Badge badge = loadOwnedBadge(badgeUuid, ownerDni);
        Instant now = Instant.now();

        badge.setConsentActive(false);
        badge.setConsentRevokedAt(now);
        badgeRepository.save(badge);

        deactivateActiveQrTokens(badge.getId(), QrCodeStatus.DEACTIVATED);
        String version = StringUtils.hasText(badge.getConsentVersion()) ? badge.getConsentVersion() : DEFAULT_CONSENT_VERSION;
        recordConsentAudit(badge, ConsentAction.REVOKED, version, ownerDni, now);

        return toFamilySummary(badge);
    }

    @Transactional
    public FamilyMemberSummaryDTO grantConsent(UUID badgeUuid, String requestedVersion, String ownerDni) {
        Badge badge = loadOwnedBadge(badgeUuid, ownerDni);
        Instant now = Instant.now();
        String version = StringUtils.hasText(requestedVersion) ? requestedVersion.trim() : DEFAULT_CONSENT_VERSION;

        badge.setConsentActive(true);
        badge.setConsentVersion(version);
        badge.setConsentAcceptedAt(now);
        badge.setConsentRevokedAt(null);
        badgeRepository.save(badge);

        recordConsentAudit(badge, ConsentAction.GRANTED, version, ownerDni, now);
        return toFamilySummary(badge);
    }

    public Badge resolveBadgeByQrToken(UUID qrToken) {
        Optional<BadgeQrCode> qrCodeOpt = badgeQrCodeRepository.findByQrToken(qrToken);
        if (qrCodeOpt.isPresent()) {
            BadgeQrCode qrCode = qrCodeOpt.get();
            if (qrCode.getStatus() != QrCodeStatus.ACTIVE) {
                throw new QrRevokedException("Este código QR fue desactivado o revocado y ya no es válido.");
            }
            Badge badge = qrCode.getBadge();
            if (Boolean.FALSE.equals(badge.getConsentActive())) {
                throw new QrRevokedException("El consentimiento informado de este perfil fue revocado.");
            }
            return badge;
        }

        // Legacy compatibility for pre-Sprint 2 badges without badge_qr_codes rows
        Badge legacyBadge = badgeRepository.findByUuid(qrToken)
                .orElseThrow(() -> new EntityNotFoundException("Credencial no encontrada para el QR escaneado."));
        List<BadgeQrCode> history = badgeQrCodeRepository.findByBadgeIdOrderByCreatedAtDesc(legacyBadge.getId());
        if (!history.isEmpty()) {
            throw new QrRevokedException("Este código QR fue reemplazado o revocado.");
        }
        if (Boolean.FALSE.equals(legacyBadge.getConsentActive())) {
            throw new QrRevokedException("El consentimiento informado de este perfil fue revocado.");
        }
        return legacyBadge;
    }

    private Badge loadOwnedBadge(UUID badgeUuid, String ownerDni) {
        Badge badge = badgeRepository.findByUuid(badgeUuid)
                .orElseThrow(() -> new EntityNotFoundException("Familiar no encontrado para el UUID: " + badgeUuid));
        if (badge.getUserRegister() == null || !badge.getUserRegister().getDni().equals(ownerDni)) {
            throw new AccessDeniedException("No tienes permiso para administrar este perfil.");
        }
        return badge;
    }

    private void deactivateActiveQrTokens(Long badgeId, QrCodeStatus targetStatus) {
        Instant now = Instant.now();
        List<BadgeQrCode> codes = badgeQrCodeRepository.findByBadgeIdOrderByCreatedAtDesc(badgeId);
        for (BadgeQrCode code : codes) {
            if (code.getStatus() == QrCodeStatus.ACTIVE) {
                code.setStatus(targetStatus);
                code.setDeactivatedAt(now);
                badgeQrCodeRepository.save(code);
            }
        }
    }

    private void recordConsentAudit(Badge badge, ConsentAction action, String version, String actorDni, Instant actedAt) {
        consentAuditRepository.save(ConsentAudit.builder()
                .action(action)
                .consentVersion(version)
                .actorDni(actorDni)
                .actedAt(actedAt)
                .badge(badge)
                .build());
    }

    private UUID resolveActiveQrToken(Badge badge) {
        if (badge.getId() == null) {
            return badge.getUuid();
        }
        List<BadgeQrCode> codes = badgeQrCodeRepository.findByBadgeIdOrderByCreatedAtDesc(badge.getId());
        return codes.stream()
                .filter(code -> code.getStatus() == QrCodeStatus.ACTIVE)
                .map(BadgeQrCode::getQrToken)
                .findFirst()
                .orElse(codes.isEmpty() ? badge.getUuid() : null);
    }

    private FamilyMemberSummaryDTO toFamilySummary(Badge badge) {
        List<BadgeQrCode> codes = badge.getId() != null
                ? badgeQrCodeRepository.findByBadgeIdOrderByCreatedAtDesc(badge.getId())
                : List.of();
        BadgeQrCode latest = codes.isEmpty() ? null : codes.get(0);
        UUID activeToken = codes.stream()
                .filter(c -> c.getStatus() == QrCodeStatus.ACTIVE)
                .map(BadgeQrCode::getQrToken)
                .findFirst()
                .orElse(null);

        QrCodeStatus status = latest != null
                ? latest.getStatus()
                : (Boolean.FALSE.equals(badge.getConsentActive()) ? QrCodeStatus.DEACTIVATED : QrCodeStatus.ACTIVE);
        UUID latestToken = latest != null ? latest.getQrToken() : badge.getUuid();

        return FamilyMemberSummaryDTO.builder()
                .badgeUuid(badge.getUuid())
                .fullName(badge.getFullName())
                .firstName(NameUtils.extractFirstName(badge.getFullName()))
                .maskedDni(NameUtils.maskDni(badge.getDni()))
                .dateOfBirth(badge.getDateOfBirth())
                .gender(badge.getGender())
                .photoUrl(badge.getPhotoUrl())
                .guardiansCount(badge.getGuardians() != null ? badge.getGuardians().size() : 0)
                .activeQrToken(activeToken != null ? activeToken : (codes.isEmpty() && !Boolean.FALSE.equals(badge.getConsentActive()) ? badge.getUuid() : null))
                .latestQrToken(latestToken)
                .qrStatus(status)
                .consentActive(!Boolean.FALSE.equals(badge.getConsentActive()))
                .consentVersion(StringUtils.hasText(badge.getConsentVersion()) ? badge.getConsentVersion() : DEFAULT_CONSENT_VERSION)
                .consentAcceptedAt(badge.getConsentAcceptedAt())
                .consentRevokedAt(badge.getConsentRevokedAt())
                .build();
    }

    private void enrichBadgeResponse(BadgeResponseDTO dto, Badge badge, UUID activeQrToken) {
        if (dto == null) {
            return;
        }
        dto.setActiveQrToken(activeQrToken);
        dto.setConsentActive(!Boolean.FALSE.equals(badge.getConsentActive()));
        dto.setConsentVersion(StringUtils.hasText(badge.getConsentVersion()) ? badge.getConsentVersion() : DEFAULT_CONSENT_VERSION);
        dto.setConsentAcceptedAt(badge.getConsentAcceptedAt());
    }

    private String buildEmailTemplate(Guardians guardian, Badge savedBadge, String urlPerfil) {
        String mensajeRol = guardian.isLegalRepresentative()
                ? "Como <strong>Representante Legal</strong>, has sido asignado para recibir las notificaciones principales en caso de que este código sea escaneado por personal de asistencia o autoridades."
                : "Como <strong>Contacto de Emergencia</strong>, has sido registrado en nuestro sistema para brindar apoyo y ser notificado en caso de requerir asistencia adicional.";

        return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Registro de Seguridad - TE ENCONTRÉ</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 30px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; border: 1px solid #e0e0e0;">
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #e53e3e; border-radius: 10px 10px 0 0;">
                                    <h2 style="color: #ffffff; margin: 0;">NUEVO REGISTRO DE SEGURIDAD</h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="font-size: 16px; color: #333;">Hola <strong>{{nombre_apoderado}}</strong>,</p>
                                    <p style="font-size: 16px; color: #333;">Se ha generado correctamente una nueva credencial de identificación (Badge) para:</p>

                                    <div style="background-color: #fff5f5; border: 1px solid #feb2b2; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
                                        <img src="{{foto_perfil}}" alt="Foto de {{nombre_persona}}" style="width: 130px; height: 130px; border-radius: 50%; object-fit: cover; border: 4px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 15px;">
                                        <div style="text-align: left; background-color: #ffffff; padding: 15px; border-radius: 5px;">
                                            <p style="margin: 5px 0; font-size: 15px;"><strong>Nombre completo:</strong> {{nombre_persona}}</p>
                                            <p style="margin: 5px 0; font-size: 15px;"><strong>Su vínculo:</strong> {{parentesco}}</p>
                                        </div>
                                    </div>

                                    <p style="font-size: 16px; color: #333; text-align: center;"><strong>Código QR de Emergencia:</strong></p>
                                    <div align="center" style="margin-bottom: 20px;">
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={{url_perfil}}"
                                             alt="QR de Emergencia"
                                             style="border: 5px solid #eee; padding: 10px; border-radius: 10px; width: 180px; height: 180px;">
                                        <p style="font-size: 12px; color: #777; margin-top: 5px;">Este QR dirige a la información vital en caso de extravío.</p>
                                    </div>

                                    <p style="font-size: 14px; color: #666; line-height: 1.5;">
                                        {{mensaje_rol}}
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f8fafc; font-size: 12px; color: #999; border-radius: 0 0 10px 10px;">
                                    © 2026 Plataforma TE ENCONTRÉ | Seguridad y Protección.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
                .replace("{{nombre_apoderado}}", guardian.getName())
                .replace("{{nombre_persona}}", savedBadge.getFullName())
                .replace("{{parentesco}}", guardian.getRelationship().toString())
                .replace("{{url_perfil}}", urlPerfil)
                .replace("{{foto_perfil}}", savedBadge.getPhotoUrl())
                .replace("{{mensaje_rol}}", mensajeRol);
    }

    private void enviarCorreosNotificacion(Badge savedBadge, UUID qrToken) {
        if (savedBadge.getGuardians() == null) return;

        String base = frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173";
        String urlPerfil = base + "/gafete/" + qrToken;

        for (Guardians guardian : savedBadge.getGuardians()) {
            try {
                String htmlContent = buildEmailTemplate(guardian, savedBadge, urlPerfil);
                emailOrchestratorService.sendManageEmail("GUARDIANS", guardian.getUuid(), guardian.getEmail(), "Nuevo Registro... TE ENCONTRÉ", htmlContent);
            } catch (Exception e) {
                log.error("Error enviando correo de confirmación al guardián {}: {}", guardian.getEmail(), e.getMessage());
            }
        }
    }

    private void validarDnis(BadgeRequestDTO requestDTO) {
        if (!dniService.existeDni(requestDTO.getDni())) {
            throw new IllegalArgumentException(String.format("El DNI del gafete %s no existe en los registros oficiales.", requestDTO.getDni()));
        }

        List<GuardiansRequestDTO> guardians = requestDTO.getGuardians();
        if (guardians != null) {
            for (int i = 0; i < guardians.size(); i++) {
                if (!dniService.existeDni(guardians.get(i).getDni())) {
                    throw new IllegalArgumentException(String.format("El DNI %s del guardián [%d] no existe en los registros oficiales.", guardians.get(i).getDni(), i));
                }
            }
        }
    }
}
