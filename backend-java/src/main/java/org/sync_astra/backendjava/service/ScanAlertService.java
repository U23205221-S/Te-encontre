package org.sync_astra.backendjava.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
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
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanAlertService {

    private final ScanAlertRepository scanAlertRepository;
    private final ResendEmailService resendEmailService;
    private final ScanAlertMapper scanAlertMapper;
    private final ImageStorageService imageStorageService;

    @Value("${app.alert.group-email:admin@teencontre.com}")
    private String alertGroupEmail;

    // Usamos REQUIRES_NEW para que el guardado de la alerta sea independiente
    // y no afecte la transacción principal de búsqueda si algo falla.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processAndSendAlert(Badge badge, MultipartFile file, ScanAlertRequestDTO request) {
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
        alert.setBadge(badge);
        // 2. Guarda la entidad en BD
        alert = scanAlertRepository.save(alert);

        // Corregido el enlace de Google Maps para usar lat y lon reales
        String googleMapsLink = String.format(java.util.Locale.US, "https://www.google.com/maps?q=%f,%f", request.getLatitude(), request.getLongitude());
        String nombreApoderado = badge.getGuardians().getFirst().getName(); // O el nombre del tutor específico
        String nombrePersonaEncontrada = badge.getFullName();

        String subject = "¡ALERTA DE UBICACIÓN! - Tu familiar ha sido localizado";
        String body = """
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
                                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">🚨 ¡ALERTA DE LOCALIZACIÓN! 🚨</h1>
                                            <p style="color: #fff5f5; margin: 10px 0 0 0; font-size: 16px;">Se ha registrado un escaneo de tu familiar.</p>
                                        </td>
                                    </tr>
                
                                    <tr>
                                        <td style="padding: 30px;">
                                            <p style="font-size: 16px; color: #333; margin-top: 0;">Hola <strong>{{nombre_apoderado}}</strong>,</p>
                                            <p style="font-size: 16px; color: #333;">Alguien acaba de escanear la credencial o fue reconocido mediante el sistema facial: <strong>{{nombre_persona_encontrada}}</strong>.</p>
                
                                            <div style="text-align: center; margin: 25px 0;">
                                                <p style="font-size: 14px; color: #718096; margin-bottom: 10px; font-weight: bold;">FOTO TOMADA EN EL LUGAR:</p>
                                                <img src="{{foto_reporte}}" alt="Foto del lugar" style="max-width: 100%; height: auto; max-height: 300px; border-radius: 8px; border: 3px solid #e2e8f0; object-fit: cover;">
                                            </div>
                
                                            <div style="text-align: center; margin: 30px 0;">
                                                <a href="{{enlace_google_maps}}" style="display: inline-block; background-color: #2b6cb0; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(43, 108, 176, 0.3);">
                                                    📍 Ver Ubicación Exacta
                                                </a>
                                                <p style="font-size: 13px; color: #718096; margin-top: 10px;">Lat: {{latitud}} | Lon: {{longitud}}</p>
                                            </div>
                
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
                
                                            <p style="font-size: 15px; color: #c53030; font-weight: bold; text-align: center; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 20px;">
                                                Por favor, comunícate inmediatamente con la persona que reportó o acércate a la ubicación indicada.
                                            </p>
                                        </td>
                                    </tr>
                
                                    <tr>
                                        <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0;">
                                            <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                                                Este es un mensaje de emergencia generado automáticamente por <strong>TE ENCONTRÉ</strong>.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.replace("{{nombre_apoderado}}", nombreApoderado != null ? nombreApoderado : "Familiar")
                .replace("{{nombre_persona_encontrada}}", nombrePersonaEncontrada)
                .replace("{{foto_reporte}}", request.getPhotoReport())
                .replace("{{enlace_google_maps}}", googleMapsLink)
                .replace("{{latitud}}", String.valueOf(request.getLatitude()))
                .replace("{{longitud}}", String.valueOf(request.getLongitude()))
                .replace("{{nombre_reportante}}", request.getFullNameReporter() != null ? request.getFullNameReporter() : "Anónimo")
                .replace("{{dni_reportante}}", request.getDniReporter() != null ? request.getDniReporter() : "No registrado")
                .replace("{{telefono_reportante}}", request.getPhoneReporter() != null ? request.getPhoneReporter() : "No registrado");

        for (Guardians guardian : badge.getGuardians()) {
            CompletableFuture<Boolean> booleanCompletableFuture = resendEmailService.sendEmail(guardian.getEmail(), subject, body);
        }


        // 4. Actualiza la alerta con el estado del correo
        scanAlertRepository.save(alert);
    }
}
