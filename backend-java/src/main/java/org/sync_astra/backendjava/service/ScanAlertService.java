package org.sync_astra.backendjava.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.sync_astra.backendjava.dtos.request.ScanAlertPart2RequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.mapper.mapperImpl.BadgeMapper;
import org.sync_astra.backendjava.mapper.mapperImpl.ScanAlertMapper;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.Guardians;
import org.sync_astra.backendjava.model.ScanAlert;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.ScanAlertRepository;
import org.sync_astra.backendjava.service.cloudinary.ImageStorageService;
import org.sync_astra.backendjava.service.messaging.ResendEmailService;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanAlertService {

    private final ScanAlertRepository scanAlertRepository;
    private final ResendEmailService resendEmailService;
    private final ScanAlertMapper scanAlertMapper;
    private final ImageStorageService imageStorageService;
    private final BadgeMapper badgeMapper;

    @Value("${app.alert.group-email:admin@teencontre.com}")
    private String alertGroupEmail;

    // Usamos REQUIRES_NEW para que el guardado de la alerta sea independiente
    // y no afecte la transacción principal de búsqueda si algo falla.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID processAndSendAlert(Badge badge, MultipartFile file, ScanAlertRequestDTO request) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("La imagen no puede estar vacía.");
        }

        try {
            // MODIFICACIÓN CRÍTICA: Delegamos el guardado a Cloudinary
            // Esto devolverá una URL pública lista para usarse en React
            String photoUrl = imageStorageService.uploadImage(file, "reports");
            request.setPhotoReport(photoUrl);

        } catch (IOException e) {
            // Mantenemos el control de errores similar al que tenías para no romper la respuesta al frontend
            log.error("Fallo crítico al subir archivo a la nube: {}", e.getMessage());
            throw new RuntimeException("Error en el sistema de almacenamiento en la nube.");
        }



        log.info("Registrando alerta de escaneo para el Badge ID: {}", badge.getId());



        // 1. Crea la entidad con emailSent = false
        ScanAlert alert = scanAlertMapper.toModel(request);
        alert.setDniReporter("anónimo"); // O puedes dejarlo nulo si prefieres
        alert.setFullNameReporter("anónimo"); // O puedes dejarlo nulo si prefieres
        alert.setPhoneReporter("anónimo"); // O puedes dejarlo nulo si prefieres
        alert.setBadge(badge);
        // 2. Guarda la entidad en BD
        alert = scanAlertRepository.save(alert);

        // Se corrige el formato del enlace de Google Maps para asegurar compatibilidad
        String googleMapsLink = String.format(java.util.Locale.US, "https://www.google.com/maps?q=%f,%f", request.getLatitude(), request.getLongitude());
        String nombrePersonaEncontrada = badge.getFullName();

        // Enlaces de acción para los botones
        String urlConfirmacion = "https://tu-dominio.com/alertas/confirmar?id=" + request.getQrCodeUuid();
        String urlAutoridades = "tel:105";

        String subject = "¡ALERTA DE UBICACIÓN! - Posible localización de tu familiar";

        // 1. ARMAMOS LA PLANTILLA BASE (Reemplazamos todo EXCEPTO el nombre del apoderado)
        String baseHtmlContent = """
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>¡ALERTA URGENTE! - TE ENCONTRÉ</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; border: 2px solid #e53e3e; overflow: hidden; box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);">
                            <tr>
                                <td align="center" style="padding: 25px 20px; background-color: #e53e3e;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">🚨 ALERTA DE LOCALIZACIÓN 🚨</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="font-size: 16px; color: #333; margin-top: 0;">Hola <strong>{{nombre_apoderado}}</strong>,</p>
                                    
                                    <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
                                        El sistema ha registrado un escaneo o reconocimiento facial asociado a: <strong>{{nombre_persona_encontrada}}</strong>.
                                    </p>
        
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
                                        <p style="font-size: 14px; color: #4a5568; margin-top: 0; margin-bottom: 15px; font-weight: bold;">FOTO TOMADA EN EL LUGAR:</p>
                                        <img src="{{foto_reporte}}" alt="Foto del reporte" style="max-width: 100%; height: auto; max-height: 250px; border-radius: 6px; object-fit: cover; margin-bottom: 20px;">
                                        
                                        <p style="font-size: 14px; color: #4a5568; margin-bottom: 15px; font-weight: bold;">UBICACIÓN REGISTRADA:</p>
                                        <p style="font-size: 13px; color: #718096; margin-top: 0; margin-bottom: 15px;">Lat: {{latitud}} | Lon: {{longitud}}</p>
                                        <a href="{{enlace_google_maps}}" style="display: inline-block; background-color: #edf2f7; color: #2b6cb0; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold; border: 1px solid #cbd5e0;">
                                            📍 Ver en Google Maps
                                        </a>
                                    </div>
        
                                    <p style="font-size: 15px; color: #2d3748; font-weight: bold; text-align: center; margin-bottom: 20px;">
                                        ¿Reconoces a tu familiar en esta imagen?
                                    </p>
        
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                                        <tr>
                                            <td align="center" style="padding-bottom: 15px;">
                                                <a href="{{url_confirmacion}}" style="display: inline-block; width: 80%; max-width: 300px; background-color: #48bb78; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center;">
                                                    ✅ Sí, es mi familiar
                                                </a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center">
                                                <a href="{{url_autoridades}}" style="display: inline-block; width: 80%; max-width: 300px; background-color: #ffffff; color: #c53030; text-decoration: none; padding: 14px 20px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center; border: 2px solid #c53030;">
                                                    🚓 Contactar a Seguridad
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                                        Mensaje automático de emergencia generado por <strong>TE ENCONTRÉ</strong>.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    """.replace("{{nombre_persona_encontrada}}", nombrePersonaEncontrada)
                .replace("{{foto_reporte}}", request.getPhotoReport())
                .replace("{{enlace_google_maps}}", googleMapsLink)
                .replace("{{latitud}}", String.valueOf(request.getLatitude()))
                .replace("{{longitud}}", String.valueOf(request.getLongitude()))
                .replace("{{url_confirmacion}}", urlConfirmacion)
                .replace("{{url_autoridades}}", urlAutoridades);

        // 2. ITERAMOS Y PERSONALIZAMOS EL CORREO PARA CADA GUARDIÁN
        for (Guardians guardian : badge.getGuardians()) {
            String nombreApoderado = guardian.getName() != null ? guardian.getName() : "Familiar";

            // Creamos una copia final del HTML reemplazando específicamente el nombre de este guardián
            String finalHtmlContent = baseHtmlContent.replace("{{nombre_apoderado}}", nombreApoderado);

            resendEmailService.sendEmail(guardian.getEmail(), subject, finalHtmlContent);
        }

        return alert.getUuid();
    }

    @Transactional
    public BadgeResponseDTO processAndSendAlertPart2(UUID uuid, ScanAlertPart2RequestDTO request) {
        ScanAlert alert = scanAlertRepository.findByUuid(uuid)
                .orElseThrow(() -> new EntityNotFoundException("Alerta no encontrada con UUID: " + uuid));

        boolean hasReporterInfo = false;

        // Validamos y seteamos el DNI
        if (StringUtils.hasText(request.getDniReporter())) {
            alert.setDniReporter(request.getDniReporter());
            alert.setFullNameReporter("Anónimo"); // Aquí se usará la extracción de datos RENIEC
            hasReporterInfo = true;
        }

        // Validamos y seteamos el teléfono
        if (StringUtils.hasText(request.getPhoneReporter())) {
            alert.setPhoneReporter(request.getPhoneReporter());
            hasReporterInfo = true;
        }

        scanAlertRepository.save(alert); // Opcional, @Transactional ya guarda los cambios

        // SOLO enviamos el correo si al menos uno de los datos (DNI o Teléfono) fue proporcionado
        if (hasReporterInfo) {
            String subject = "ACTUALIZACIÓN URGENTE: Datos de contacto de quien localizó a tu familiar";
            String nombreFamiliar = alert.getBadge().getFullName();

            // Preparamos los datos a mostrar (manejando el caso de que uno de los dos venga vacío)
            String nombreReportante = alert.getFullNameReporter() != null ? alert.getFullNameReporter() : "Anónimo";
            String dniReportante = StringUtils.hasText(alert.getDniReporter()) ? alert.getDniReporter() : "No registrado";
            String telefonoReportante = StringUtils.hasText(alert.getPhoneReporter()) ? alert.getPhoneReporter() : "No registrado";

            for (Guardians guardian : alert.getBadge().getGuardians()) {
                String htmlContent = """
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <title>Actualización de Alerta - TE ENCONTRÉ</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
                            <tr>
                                <td align="center">
                                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; border: 2px solid #2b6cb0; overflow: hidden; box-shadow: 0 4px 10px rgba(43, 108, 176, 0.2);">
                                        <tr>
                                            <td align="center" style="padding: 20px; background-color: #2b6cb0;">
                                                <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">📞 NUEVA INFORMACIÓN DE CONTACTO</h1>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 30px;">
                                                <p style="font-size: 16px; color: #333; margin-top: 0;">Hola <strong>{{nombre_apoderado}}</strong>,</p>
                                                <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
                                                    La persona que localizó a <strong>{{nombre_familiar}}</strong> ha compartido sus datos de contacto para que puedas comunicarte con ella directamente.
                                                </p>
                                                
                                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-left: 4px solid #48bb78; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                                                    <tr>
                                                        <td>
                                                            <h3 style="margin: 0 0 10px 0; color: #2f855a; font-size: 16px;">👤 Datos de la persona que reportó:</h3>
                                                            <p style="margin: 5px 0; font-size: 15px; color: #4a5568;"><strong>Nombre:</strong> {{nombre_reportante}}</p>
                                                            <p style="margin: 5px 0; font-size: 15px; color: #4a5568;"><strong>DNI:</strong> {{dni_reportante}}</p>
                                                            <p style="margin: 5px 0; font-size: 15px; color: #4a5568;"><strong>Teléfono:</strong> <a href="tel:{{telefono_reportante}}" style="color: #2b6cb0; text-decoration: none;">{{telefono_reportante}}</a></p>
                                                        </td>
                                                    </tr>
                                                </table>
                    
                                                <p style="font-size: 15px; color: #c53030; font-weight: bold; text-align: center; margin-top: 25px; border-top: 1px solid #edf2f7; padding-top: 20px;">
                                                    Te sugerimos ponerte en contacto a la brevedad posible.
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="background-color: #f8fafc; padding: 15px; border-top: 1px solid #e2e8f0;">
                                                <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                                                    Mensaje automático de actualización generado por <strong>TE ENCONTRÉ</strong>.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                    """.replace("{{nombre_apoderado}}", guardian.getName())
                        .replace("{{nombre_familiar}}", nombreFamiliar)
                        .replace("{{nombre_reportante}}", nombreReportante)
                        .replace("{{dni_reportante}}", dniReportante)
                        .replace("{{telefono_reportante}}", telefonoReportante);

                resendEmailService.sendEmail(guardian.getEmail(), subject, htmlContent);
            }
        }

        return badgeMapper.toDTO(alert.getBadge());
    }
}
