package org.sync_astra.backendjava.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.mapper.mapperImpl.BadgeMapper;
import org.sync_astra.backendjava.mapper.mapperImpl.GuardiansMapper;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.Guardians;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.BadgeRepository;
import org.sync_astra.backendjava.repository.GuardiansRepository;
import org.sync_astra.backendjava.repository.UserRepository;
import org.sync_astra.backendjava.service.cloudinary.ImageStorageService;
import org.sync_astra.backendjava.service.messaging.ResendEmailService;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class BadgeService {
    private final BadgeRepository badgeRepository;
    private final BadgeMapper badgeMapper;
    private final UserRepository userRepository; // <-- Inyectamos para buscar al escaneador
    private final ScanAlertService scanAlertService; // <-- Inyectamos el servicio de alertas
    private static final double MATCH_THRESHOLD = 0.6; // Ajustar según precisión del modelo
    // Ruta donde se guardarán las fotos (puedes ajustarla a tu monorepo)
    private final ImageStorageService imageStorageService;
    private final GuardiansMapper guardiansMapper;
    private final GuardiansRepository guardiansRepository;
    private final ResendEmailService resendEmailService;

    // IDENTIFICACIÓN POR ROSTRO: Devuelve el DTO completo si hay match
    @Transactional
    public Optional<BadgeResponseDTO> identifyByFace(ScanAlertRequestDTO requestDTO, String scannerUserName) {
        Users scannerUser = userRepository.findByDni(scannerUserName)
                .orElseThrow(() -> new EntityNotFoundException("Usuario en sesión no encontrado en la BD"));

        return badgeRepository.findBestMatch(requestDTO.getFaceVector())
                .filter(result -> result.getDistance() < MATCH_THRESHOLD)
                .flatMap(result -> badgeRepository.findById(result.getId()))
                .map(badge -> {
                    // ¡Aquí disparamos la alerta!
                    scanAlertService.processAndSendAlert(badge, requestDTO.getLatitude(), requestDTO.getLongitude(), scannerUser);
                    return badgeMapper.toDTO(badge);
                });
    }

    // BÚSQUEDA POR QR (UUID)
    @Transactional
    public BadgeResponseDTO getByUuid(ScanAlertRequestDTO requestDTO, String scannerUserName) {
        // Buscamos quién está haciendo la petición
        Users scannerUser = userRepository.findByDni(scannerUserName)
                .orElseThrow(() -> new EntityNotFoundException("Usuario en sesión no encontrado en la BD"));

        Badge badge = badgeRepository.findByUuid(requestDTO.getQrCodeUuid())
                .orElseThrow(() -> new EntityNotFoundException("Badge no encontrado para el UUID: " + requestDTO.getQrCodeUuid()));

        // ¡Aquí disparamos la alerta!
        scanAlertService.processAndSendAlert(badge, requestDTO.getLatitude(), requestDTO.getLongitude(), scannerUser);

        return badgeMapper.toDTO(badge);
    }

    // Consulta simple de badge por UUID (sin alerta, requiere auth)
    public BadgeResponseDTO getBadgeByUuid(String uuid) {
        Badge badge = badgeRepository.findByUuid(UUID.fromString(uuid))
                .orElseThrow(() -> new EntityNotFoundException("Badge no encontrado para el UUID: " + uuid));
        return badgeMapper.toDTO(badge);
    }
    /**
     * REGISTRO MODIFICADO: Crea un nuevo badge subiendo la foto a Cloudinary.
     */
    @Transactional
    public BadgeResponseDTO createWithPhoto(BadgeRequestDTO requestDTO, MultipartFile file, String registerUserName) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("La imagen no puede estar vacía.");
        }

        try {
            // MODIFICACIÓN CRÍTICA: Delegamos el guardado a Cloudinary
            // Esto devolverá una URL pública lista para usarse en React
            String photoUrl = imageStorageService.uploadImage(file, "badges");
            requestDTO.setPhotoUrl(photoUrl);

        } catch (IOException e) {
            // Mantenemos el control de errores similar al que tenías para no romper la respuesta al frontend
            log.error("Fallo crítico al subir archivo a la nube: {}", e.getMessage());
            throw new RuntimeException("Error en el sistema de almacenamiento en la nube.");
        }

        Badge badge = badgeMapper.toModel(requestDTO);
        badge.setUserRegister(userRepository.findByDni(registerUserName)
                .orElseThrow(() -> new EntityNotFoundException("Usuario en sesión no encontrado en la BD")));
        Badge savedBadge = badgeRepository.save(badge);

        Guardians guardian = guardiansMapper.toModel(requestDTO.getGuardian());
        guardian.setLegalRepresentative(true);
        guardian.setBadge(savedBadge);
        guardian.setEmail(badge.getUserRegister().getEmail());
        guardiansRepository.save(guardian); // Guardamos de nuevo para persistir la relación con el
        String urlPerfil = "https://qr-utp-rs.pages.dev/gafete/" + savedBadge.getUuid();


        String htmlContent = """
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
       \s
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="font-size: 16px; color: #333;">Hola <strong>{{nombre_apoderado}}</strong>,</p>
                                    <p style="font-size: 16px; color: #333;">Se ha generado correctamente una nueva credencial de identificación (Badge) para:</p>
       \s
                                    <div style="background-color: #fff5f5; border: 1px solid #feb2b2; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
                                       \s
                                        <img src="{{foto_perfil}}" alt="Foto de {{nombre_persona}}" style="width: 130px; height: 130px; border-radius: 50%; object-fit: cover; border: 4px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 15px;">
                                       \s
                                        <div style="text-align: left; background-color: #ffffff; padding: 15px; border-radius: 5px;">
                                            <p style="margin: 5px 0; font-size: 15px;"><strong>Nombre completo:</strong> {{nombre_persona}}</p>
                                            <p style="margin: 5px 0; font-size: 15px;"><strong>Alergias registradas:</strong> {{alergias}}</p>
                                            <p style="margin: 5px 0; font-size: 15px;"><strong>Su vinculo:</strong> {{parentesco}}</p>
                                        </div>
                                    </div>
       \s
                                    <p style="font-size: 16px; color: #333; text-align: center;"><strong>Código QR de Emergencia:</strong></p>
                                    <div align="center" style="margin-bottom: 20px;">
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={{url_perfil}}"\s
                                             alt="QR de Emergencia"\s
                                             style="border: 5px solid #eee; padding: 10px; border-radius: 10px; width: 180px; height: 180px;">
                                        <p style="font-size: 12px; color: #777; margin-top: 5px;">Este QR dirige a la información vital en caso de extravío.</p>
                                    </div>
       \s
                                    <p style="font-size: 14px; color: #666; line-height: 1.5;">
                                        Como <strong>Representante Legal</strong>, has sido asignado para recibir notificaciones en caso de que este código sea escaneado por personal de asistencia o autoridades.
                                    </p>
                                </td>
                            </tr>
       \s
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
       \s""".replace("{{nombre_apoderado}}", guardian.getName())
                .replace("{{nombre_persona}}", savedBadge.getFullName())
                .replace("{{alergias}}", savedBadge.getAllergies())
                .replace("{{parentesco}}", guardian.getRelationship().toString())
                .replace("{{url_perfil}}", urlPerfil)
                .replace("{{foto_perfil}}", savedBadge.getPhotoUrl()); // NUEVO REPLACE AÑADIDO

        resendEmailService.sendEmail(guardian.getEmail(), "Confirmación de Registro: " + savedBadge.getFullName(), htmlContent);




        log.info("Nuevo Badge registrado con éxito en Cloudinary. UUID: {}", savedBadge.getUuid());
        log.info("Guardian asociado(UUID:{}): {} ({}), relación: {}", guardian.getUuid(), guardian.getName(), guardian.getDni(), guardian.getRelationship());
        return badgeMapper.toDTO(savedBadge);
    }
}
