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
        guardiansRepository.save(guardian); // Guardamos de nuevo para persistir la relación con el

        log.info("Nuevo Badge registrado con éxito en Cloudinary. UUID: {}", savedBadge.getUuid());
        log.info("Guardian asociado(UUID:{}): {} ({}), relación: {}", guardian.getUuid(), guardian.getName(), guardian.getDni(), guardian.getRelationship());
        return badgeMapper.toDTO(savedBadge);
    }
}
