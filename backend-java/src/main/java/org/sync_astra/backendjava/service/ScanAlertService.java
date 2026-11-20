package org.sync_astra.backendjava.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.sync_astra.backendjava.dtos.request.ScanAlertPart2RequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.response.GuardianAlertDTO;
import org.sync_astra.backendjava.dtos.response.PublicAssistanceDTO;
import org.sync_astra.backendjava.dtos.response.PublicContactDTO;
import org.sync_astra.backendjava.mapper.mapperImpl.BadgeMapper;
import org.sync_astra.backendjava.mapper.mapperImpl.ScanAlertMapper;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.Categories.AlertStatus;
import org.sync_astra.backendjava.model.Guardians;
import org.sync_astra.backendjava.model.ScanAlert;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.ScanAlertRepository;
import org.sync_astra.backendjava.repository.UserRepository;
import org.sync_astra.backendjava.service.apiCloud.DniResponse;
import org.sync_astra.backendjava.service.apiCloud.DniService;
import org.sync_astra.backendjava.service.cloudinary.ImageStorageService;
import org.sync_astra.backendjava.service.email.EmailOrchestratorService;
import org.sync_astra.backendjava.util.NameUtils;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanAlertService {

    private static final long ESCALATION_WINDOW_SECONDS = 120L;

    private final ScanAlertRepository scanAlertRepository;
    private final EmailOrchestratorService emailOrchestratorService;
    private final ScanAlertMapper scanAlertMapper;
    private final ImageStorageService imageStorageService;
    private final BadgeMapper badgeMapper;
    private final DniService dniService;
    private final UserRepository userRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl = "http://localhost:5173";

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID processAndSendAlert(Badge badge, MultipartFile file, ScanAlertRequestDTO request) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("La imagen no puede estar vacía.");
        }

        try {
            String photoUrl = imageStorageService.uploadImage(file, "reports");
            request.setPhotoReport(photoUrl);
        } catch (IOException e) {
            log.error("Fallo crítico al subir archivo a la nube: {}", e.getMessage());
            throw new RuntimeException("Error en el sistema de almacenamiento en la nube.");
        }

        Instant now = Instant.now();
        UUID confirmationToken = UUID.randomUUID();

        ScanAlert alert = scanAlertMapper.toModel(request);
        alert.setDniReporter("anónimo");
        alert.setFullNameReporter("anónimo");
        alert.setPhoneReporter("anónimo");
        alert.setBadge(badge);
        alert.setStatus(AlertStatus.ACTIVE);
        alert.setExpiresAt(now.plusSeconds(ESCALATION_WINDOW_SECONDS));
        alert.setConfirmationToken(confirmationToken);
        alert.setGpsAccuracyMeters(request.getGpsAccuracyMeters());

        alert = scanAlertRepository.save(alert);

        Guardians primaryGuardian = resolvePrimaryGuardian(badge);
        if (primaryGuardian != null) {
            String html = buildAlertEmailHtml(
                    primaryGuardian,
                    NameUtils.extractFirstName(badge.getFullName()),
                    request.getPhotoReport(),
                    request.getLatitude(),
                    request.getLongitude(),
                    buildConfirmationUrl(alert.getUuid(), confirmationToken),
                    false
            );
            emailOrchestratorService.sendManageEmail(
                    "GUARDIANS",
                    primaryGuardian.getUuid(),
                    primaryGuardian.getEmail(),
                    "¡ALERTA SOS DE UBICACIÓN! - Posible localización de tu familiar",
                    html,
                    "PRIMARY_GUARDIAN"
            );
        }

        return alert.getUuid();
    }

    @Transactional
    public PublicAssistanceDTO processAndSendAlertPart2(UUID uuid, ScanAlertPart2RequestDTO request) {
        ScanAlert alert = scanAlertRepository.findByUuid(uuid)
                .orElseThrow(() -> new EntityNotFoundException("Alerta no encontrada con UUID: " + uuid));

        boolean hasReporterInfo = false;

        if (request != null && StringUtils.hasText(request.getDniReporter())) {
            alert.setDniReporter(request.getDniReporter());
            DniResponse.DatosDni data = dniService.obtenerDatosDni(request.getDniReporter());
            if (data != null) {
                String fullName = data.getNombres() + " " + data.getApellidoPaterno() + " " + data.getApellidoMaterno();
                alert.setFullNameReporter(fullName);
                hasReporterInfo = true;
            } else {
                throw new RuntimeException("Ingrese un DNI Valido");
            }
        }

        if (request != null && StringUtils.hasText(request.getPhoneReporter())) {
            alert.setPhoneReporter(request.getPhoneReporter());
            hasReporterInfo = true;
        }

        scanAlertRepository.save(alert);

        if (hasReporterInfo) {
            notifyReporterDetails(alert);
        }

        return buildPublicAssistanceDTO(alert);
    }

    @Transactional(readOnly = true)
    public PublicAssistanceDTO getPublicAlertStatus(UUID alertUuid) {
        ScanAlert alert = scanAlertRepository.findByUuid(alertUuid)
                .orElseThrow(() -> new EntityNotFoundException("Alerta no encontrada con UUID: " + alertUuid));
        return buildPublicAssistanceDTO(alert);
    }

    @Transactional(readOnly = true)
    public List<GuardianAlertDTO> getMyAlerts(String ownerDni) {
        Users owner = userRepository.findByDni(ownerDni)
                .orElseThrow(() -> new EntityNotFoundException("Usuario en sesión no encontrado en la BD"));
        return scanAlertRepository.findByBadge_UserRegisterOrderByScannedAtDesc(owner)
                .stream()
                .map(alert -> toGuardianAlertDTO(alert, alert.getStatus() == AlertStatus.CONFIRMED))
                .toList();
    }

    @Transactional
    public GuardianAlertDTO confirmAlert(UUID alertUuid, UUID confirmationToken, String authenticatedDni) {
        ScanAlert alert = scanAlertRepository.findWithBadgeByUuid(alertUuid)
                .orElseThrow(() -> new EntityNotFoundException("Alerta no encontrada con UUID: " + alertUuid));

        boolean isOwner = authenticatedDni != null
                && alert.getBadge() != null
                && alert.getBadge().getUserRegister() != null
                && authenticatedDni.equals(alert.getBadge().getUserRegister().getDni());
        boolean hasValidToken = confirmationToken != null
                && confirmationToken.equals(alert.getConfirmationToken());

        if (!isOwner && !hasValidToken) {
            throw new AccessDeniedException("No tienes autorización para confirmar esta alerta.");
        }

        if (alert.getStatus() == AlertStatus.CONFIRMED) {
            return toGuardianAlertDTO(alert, true);
        }

        Instant now = Instant.now();
        String actorDni = authenticatedDni != null ? authenticatedDni : "TOKEN_LINK";
        int updated = scanAlertRepository.markConfirmedIfConfirmable(
                alertUuid,
                List.of(AlertStatus.ACTIVE, AlertStatus.ESCALATED),
                AlertStatus.CONFIRMED,
                now,
                actorDni
        );

        ScanAlert latest = scanAlertRepository.findWithBadgeByUuid(alertUuid).orElse(alert);
        if (updated == 1) {
            if (latest.getStatus() != AlertStatus.CONFIRMED) {
                latest.setStatus(AlertStatus.CONFIRMED);
            }
            if (latest.getConfirmedAt() == null) {
                latest.setConfirmedAt(now);
            }
            if (latest.getConfirmedByDni() == null) {
                latest.setConfirmedByDni(actorDni);
            }
            return toGuardianAlertDTO(latest, false);
        }

        return toGuardianAlertDTO(latest, latest.getStatus() == AlertStatus.CONFIRMED);
    }

    @Transactional
    public int processExpiredAlerts() {
        Instant now = Instant.now();
        List<ScanAlert> expired = scanAlertRepository.findExpiredActiveAlerts(AlertStatus.ACTIVE, now);
        int escalatedCount = 0;

        for (ScanAlert alert : expired) {
            int claimed = scanAlertRepository.markEscalatedIfActive(
                    alert.getId(),
                    AlertStatus.ACTIVE,
                    AlertStatus.ESCALATED,
                    now
            );
            if (claimed != 1) {
                continue;
            }
            escalatedCount++;
            ScanAlert freshAlert = scanAlertRepository.findWithBadgeAndGuardiansById(alert.getId()).orElse(alert);
            notifyAuxiliaryGuardians(freshAlert);
        }
        return escalatedCount;
    }

    private void notifyAuxiliaryGuardians(ScanAlert alert) {
        Badge badge = alert.getBadge();
        if (badge == null || badge.getGuardians() == null) {
            return;
        }
        String firstName = NameUtils.extractFirstName(badge.getFullName());
        String confirmUrl = buildConfirmationUrl(alert.getUuid(), alert.getConfirmationToken());

        for (Guardians guardian : badge.getGuardians()) {
            if (guardian.isLegalRepresentative()) {
                continue;
            }
            try {
                String html = buildAlertEmailHtml(
                        guardian,
                        firstName,
                        alert.getPhotoReport(),
                        alert.getLatitude(),
                        alert.getLongitude(),
                        confirmUrl,
                        true
                );
                emailOrchestratorService.sendManageEmail(
                        "GUARDIANS",
                        guardian.getUuid(),
                        guardian.getEmail(),
                        "ESCALAMIENTO SOS: Familiar localizado sin respuesta del titular",
                        html,
                        "AUXILIARY_GUARDIAN"
                );
            } catch (Exception ex) {
                log.error("Error notificando al contacto auxiliar {}: {}", guardian.getUuid(), ex.getMessage());
            }
        }
    }

    private void notifyReporterDetails(ScanAlert alert) {
        Badge badge = alert.getBadge();
        if (badge == null || badge.getGuardians() == null) {
            return;
        }
        String subject = "ACTUALIZACIÓN URGENTE: Datos de contacto de quien localizó a tu familiar";
        String firstName = NameUtils.extractFirstName(badge.getFullName());
        String nombreReportante = alert.getFullNameReporter() != null ? alert.getFullNameReporter() : "Anónimo";
        String dniReportante = StringUtils.hasText(alert.getDniReporter()) ? alert.getDniReporter() : "No registrado";
        String telefonoReportante = StringUtils.hasText(alert.getPhoneReporter()) ? alert.getPhoneReporter() : "No registrado";

        boolean includeAuxiliaries = alert.getStatus() == AlertStatus.ESCALATED;
        for (Guardians guardian : badge.getGuardians()) {
            if (!guardian.isLegalRepresentative() && !includeAuxiliaries) {
                continue;
            }
            String role = guardian.isLegalRepresentative() ? "PRIMARY_GUARDIAN" : "AUXILIARY_GUARDIAN";
            String htmlContent = """
                <!DOCTYPE html>
                <html lang="es">
                <head><meta charset="UTF-8"><title>Actualización de Alerta - TE ENCONTRÉ</title></head>
                <body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f4f7f6;">
                  <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;border:2px solid #2b6cb0;padding:24px;">
                    <h2 style="color:#2b6cb0;margin-top:0;">📞 Información de contacto del ciudadano</h2>
                    <p>Hola <strong>{{nombre_apoderado}}</strong>, quien reportó el encuentro de <strong>{{nombre_familiar}}</strong> dejó sus datos:</p>
                    <p><strong>Nombre:</strong> {{nombre_reportante}}</p>
                    <p><strong>DNI:</strong> {{dni_reportante}}</p>
                    <p><strong>Teléfono:</strong> {{telefono_reportante}}</p>
                  </div>
                </body>
                </html>
                """
                    .replace("{{nombre_apoderado}}", guardian.getName() != null ? guardian.getName() : "Familiar")
                    .replace("{{nombre_familiar}}", firstName)
                    .replace("{{nombre_reportante}}", nombreReportante)
                    .replace("{{dni_reportante}}", dniReportante)
                    .replace("{{telefono_reportante}}", telefonoReportante);

            emailOrchestratorService.sendManageEmail("GUARDIANS", guardian.getUuid(), guardian.getEmail(), subject, htmlContent, role);
        }
    }

    private PublicAssistanceDTO buildPublicAssistanceDTO(ScanAlert alert) {
        Badge badge = alert.getBadge();
        AlertStatus status = alert.getStatus() != null ? alert.getStatus() : AlertStatus.ACTIVE;
        Instant scannedInstant = alert.getScannedAt() != null
                ? alert.getScannedAt().toInstant(ZoneOffset.UTC)
                : Instant.now();

        Guardians primary = resolvePrimaryGuardian(badge);
        PublicContactDTO primaryContact = primary != null && StringUtils.hasText(primary.getPhone())
                ? PublicContactDTO.builder().label("Apoderado Titular").telUri("tel:" + primary.getPhone()).build()
                : PublicContactDTO.builder().label("Apoderado Titular").telUri(null).build();

        List<PublicContactDTO> auxiliaryContacts = new ArrayList<>();
        String emergencyLineUri = null;
        if (status == AlertStatus.ESCALATED && badge != null && badge.getGuardians() != null) {
            int index = 1;
            for (Guardians g : badge.getGuardians()) {
                if (!g.isLegalRepresentative() && StringUtils.hasText(g.getPhone())) {
                    auxiliaryContacts.add(PublicContactDTO.builder()
                            .label("Apoderado Auxiliar " + index)
                            .telUri("tel:" + g.getPhone())
                            .build());
                    index++;
                }
            }
            emergencyLineUri = "tel:114";
        }

        return PublicAssistanceDTO.builder()
                .alertUuid(alert.getUuid())
                .firstName(NameUtils.extractFirstName(badge != null ? badge.getFullName() : null))
                .alertStatus(status.name())
                .scannedAt(scannedInstant)
                .expiresAt(alert.getExpiresAt())
                .confirmedAt(alert.getConfirmedAt())
                .serverNow(Instant.now())
                .primaryContact(primaryContact)
                .auxiliaryContacts(auxiliaryContacts)
                .emergencyLineUri(emergencyLineUri)
                .build();
    }

    private GuardianAlertDTO toGuardianAlertDTO(ScanAlert alert, boolean alreadyConfirmed) {
        Badge badge = alert.getBadge();
        String mapsLink = buildMapsLink(alert.getLatitude(), alert.getLongitude());
        String reporterName = (alert.getFullNameReporter() != null && !"anónimo".equalsIgnoreCase(alert.getFullNameReporter()))
                ? alert.getFullNameReporter() : null;
        String reporterPhone = (alert.getPhoneReporter() != null && !"anónimo".equalsIgnoreCase(alert.getPhoneReporter()))
                ? alert.getPhoneReporter() : null;

        return GuardianAlertDTO.builder()
                .alertUuid(alert.getUuid())
                .badgeUuid(badge != null ? badge.getUuid() : null)
                .dependentFullName(badge != null ? badge.getFullName() : null)
                .dependentFirstName(NameUtils.extractFirstName(badge != null ? badge.getFullName() : null))
                .status(alert.getStatus() != null ? alert.getStatus() : AlertStatus.ACTIVE)
                .scannedAt(alert.getScannedAt())
                .expiresAt(alert.getExpiresAt())
                .confirmedAt(alert.getConfirmedAt())
                .escalatedAt(alert.getEscalatedAt())
                .serverNow(Instant.now())
                .latitude(alert.getLatitude())
                .longitude(alert.getLongitude())
                .googleMapsLink(mapsLink)
                .photoReport(alert.getPhotoReport())
                .reporterName(reporterName)
                .reporterPhone(reporterPhone)
                .alreadyConfirmed(alreadyConfirmed)
                .build();
    }

    private Guardians resolvePrimaryGuardian(Badge badge) {
        if (badge == null || badge.getGuardians() == null || badge.getGuardians().isEmpty()) {
            return null;
        }
        return badge.getGuardians().stream()
                .filter(Guardians::isLegalRepresentative)
                .findFirst()
                .orElse(badge.getGuardians().get(0));
    }

    private String buildConfirmationUrl(UUID alertUuid, UUID confirmationToken) {
        String base = frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173";
        return base + "/notificaciones?alert=" + alertUuid + "&token=" + confirmationToken;
    }

    private String buildMapsLink(double latitude, double longitude) {
        return String.format(Locale.US, "https://www.google.com/maps?q=%f,%f", latitude, longitude);
    }

    private String buildAlertEmailHtml(
            Guardians guardian,
            String firstName,
            String photoReport,
            double latitude,
            double longitude,
            String confirmationUrl,
            boolean isEscalation
    ) {
        String headline = isEscalation
                ? "🚨 ESCALAMIENTO SOS (SIN CONFIRMACIÓN DEL TITULAR)"
                : "🚨 ALERTA DE LOCALIZACIÓN SOS";
        String intro = isEscalation
                ? "Han transcurrido 120 segundos sin confirmación del apoderado titular tras el hallazgo de <strong>{{nombre_persona_encontrada}}</strong>."
                : "Un ciudadano reportó haber encontrado a <strong>{{nombre_persona_encontrada}}</strong> y compartió su ubicación.";

        return """
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><title>ALERTA SOS - TE ENCONTRÉ</title></head>
        <body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f4f7f6;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:2px solid #e53e3e;overflow:hidden;">
                <tr><td align="center" style="padding:20px;background-color:#e53e3e;color:#ffffff;">
                  <h1 style="margin:0;font-size:20px;">{{headline}}</h1>
                </td></tr>
                <tr><td style="padding:24px;">
                  <p style="font-size:16px;color:#333;">Hola <strong>{{nombre_apoderado}}</strong>,</p>
                  <p style="font-size:15px;color:#333;">{{intro}}</p>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;margin:20px 0;">
                    <img src="{{foto_reporte}}" alt="Foto del encuentro" style="max-width:100%;max-height:240px;border-radius:6px;margin-bottom:14px;">
                    <p style="font-size:13px;color:#4a5568;margin:6px 0;">Coordenadas: {{latitud}}, {{longitud}}</p>
                    <a href="{{enlace_google_maps}}" style="display:inline-block;background:#edf2f7;color:#2b6cb0;text-decoration:none;padding:10px 18px;border-radius:4px;font-weight:bold;">📍 Ver ubicación en el mapa</a>
                  </div>
                  <div style="text-align:center;margin:20px 0;">
                    <a href="{{url_confirmacion}}" style="display:inline-block;background:#48bb78;color:#fff;text-decoration:none;padding:14px 24px;border-radius:6px;font-size:16px;font-weight:bold;">✅ Confirmar recepción</a>
                  </div>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """
                .replace("{{headline}}", headline)
                .replace("{{intro}}", intro)
                .replace("{{nombre_apoderado}}", guardian.getName() != null ? guardian.getName() : "Familiar")
                .replace("{{nombre_persona_encontrada}}", firstName)
                .replace("{{foto_reporte}}", photoReport != null ? photoReport : "")
                .replace("{{enlace_google_maps}}", buildMapsLink(latitude, longitude))
                .replace("{{latitud}}", String.valueOf(latitude))
                .replace("{{longitud}}", String.valueOf(longitude))
                .replace("{{url_confirmacion}}", confirmationUrl);
    }
}
