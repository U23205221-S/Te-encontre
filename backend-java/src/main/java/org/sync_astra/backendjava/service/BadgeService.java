package org.sync_astra.backendjava.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
import org.sync_astra.backendjava.dtos.request.GuardiansRequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.mapper.mapperImpl.BadgeMapper;
import org.sync_astra.backendjava.mapper.mapperImpl.GuardiansMapper;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.Categories.StatusBadge;
import org.sync_astra.backendjava.model.Guardians;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.BadgeRepository;
import org.sync_astra.backendjava.repository.GuardiansRepository;
import org.sync_astra.backendjava.repository.UserRepository;
import org.sync_astra.backendjava.service.apiCloud.DniService;
import org.sync_astra.backendjava.service.cloudinary.ImageStorageService;
import org.sync_astra.backendjava.service.email.EmailOrchestratorService;
import org.sync_astra.backendjava.service.email.ResendEmailService;


import java.io.IOException;

import java.util.List;
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
    private final EmailOrchestratorService emailOrchestratorService;
    private final DniService dniService;

    // IDENTIFICACIÓN POR ROSTRO: Devuelve el DTO completo si hay match
    @Transactional
    public UUID identifyByFace(ScanAlertRequestDTO requestDTO, MultipartFile file) {
        return badgeRepository.findBestMatch(requestDTO.getFaceVector())
                .filter(result -> result.getDistance() < MATCH_THRESHOLD)
                .flatMap(result -> badgeRepository.findById(result.getId()))
                .map(badge -> scanAlertService.processAndSendAlert(badge, file, requestDTO))
                .orElseThrow(() -> new EntityNotFoundException("No se encontró ninguna coincidencia biométrica que supere el umbral mínimo."));
    }

    // BÚSQUEDA POR QR (UUID)
    @Transactional
    public UUID getByUuid(ScanAlertRequestDTO requestDTO, MultipartFile file) {

        // 1. Buscamos el Badge por el UUID del QR
        Badge badge = badgeRepository.findByUuid(requestDTO.getQrCodeUuid())
                .orElseThrow(() -> new EntityNotFoundException("Credencial no encontrada para el QR escaneado."));

        // 2. Disparamos la alerta y retornamos directamente el UUID de esa alerta generada
        return scanAlertService.processAndSendAlert(badge, file, requestDTO);
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

        // 1. Validaciones rápidas (Fail-Fast)
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("La imagen no puede estar vacía.");
        }
        validarDnis(requestDTO);

        // 2. Consultas a BD previas a operaciones costosas (Cloudinary)
        Users userRegister = userRepository.findByDni(registerUserName)
                .orElseThrow(() -> new EntityNotFoundException("Usuario en sesión no encontrado en la BD"));

        // 3. Operación externa costosa: Subida a Cloudinary
        String photoUrl;
        try {
            photoUrl = imageStorageService.uploadImage(file, "badges");
        } catch (IOException e) {
            log.error("Fallo crítico al subir archivo a la nube: {}", e.getMessage());
            throw new RuntimeException("Error en el sistema de almacenamiento en la nube.");
        }

        // 4. Preparación y Mapeo de la Entidad
        requestDTO.setPhotoUrl(photoUrl);
        requestDTO.setStatusBadge(StatusBadge.NEUTRAL);

        Badge badge = new Badge();
        badgeMapper.updateFromDto(requestDTO, badge);
        badge.setUserRegister(userRegister);

        // 5. Configurar relación bidireccional
        if (badge.getGuardians() != null) {
            for (int i = 0; i < badge.getGuardians().size(); i++) {
                Guardians guardian = badge.getGuardians().get(i);
                guardian.setBadge(badge);
                guardian.setLegalRepresentative(i == 0); // El índice 0 siempre será true, el resto false
            }
        }

        // 6. Guardado en Base de Datos
        Badge savedBadge = badgeRepository.save(badge);
        log.info("Nuevo Badge registrado con éxito. UUID: {}", savedBadge.getUuid());

        // 7. Notificaciones
        enviarCorreosNotificacion(savedBadge);

        return badgeMapper.toDTO(savedBadge);
    }

    // Método privado para generar el HTML
    private String buildEmailTemplate(Guardians guardian, Badge savedBadge, String urlPerfil) {

        // 1. Definimos el mensaje dinámico según el rol del guardián
        String mensajeRol = guardian.isLegalRepresentative()
                ? "Como <strong>Representante Legal</strong>, has sido asignado para recibir las notificaciones principales en caso de que este código sea escaneado por personal de asistencia o autoridades."
                : "Como <strong>Contacto de Emergencia</strong>, has sido registrado en nuestro sistema para brindar apoyo y ser notificado en caso de requerir asistencia adicional.";

        // 2. Retornamos el Text Block con los reemplazos
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


    private void enviarCorreosNotificacion(Badge savedBadge) {
        if (savedBadge.getGuardians() == null) return;

        String urlPerfil = "https://qr-utp-rs.pages.dev/gafete/" + savedBadge.getUuid();

        for (Guardians guardian : savedBadge.getGuardians()) {
            try {
                String htmlContent = buildEmailTemplate(guardian, savedBadge, urlPerfil);
                emailOrchestratorService.sendManageEmail("GUARDIANS", guardian.getUuid(), guardian.getEmail(), "Nuevo Registro... TE ENCONTRÉ", htmlContent);
            } catch (Exception e) {
                // CRÍTICO: Un error enviando el correo NO debe cancelar (rollback) la creación del Badge en la BD.
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
