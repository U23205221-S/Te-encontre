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
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.BadgeRepository;
import org.sync_astra.backendjava.repository.UserRepository;

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
    private final Path rootLocation = Paths.get( "uploads", "badge").toAbsolutePath().normalize();

    // IDENTIFICACIÓN POR ROSTRO: Devuelve el DTO completo si hay match
    @Transactional
    public Optional<BadgeResponseDTO> identifyByFace(ScanAlertRequestDTO requestDTO, String scannerUserName) {
        Users scannerUser = userRepository.findByUserName(scannerUserName)
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
        Users scannerUser = userRepository.findByUserName(scannerUserName)
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
     * REGISTRO: Crea un nuevo badge con su vector facial.
     */
    @Transactional
    public BadgeResponseDTO createWithPhoto(BadgeRequestDTO requestDTO, MultipartFile file, String registerUserName) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("La imagen no puede estar vacía.");
        }

        String fileName = saveFile(file);

        // URL lógica para el WebMvcConfigurer
        String photoUrl = "/api/v1/uploads/badges/" + fileName;
        requestDTO.setPhoto(photoUrl);

        Badge badge = badgeMapper.toModel(requestDTO);
        badge.setUserParent(userRepository.findByUserName(registerUserName)
                .orElseThrow(() -> new EntityNotFoundException("Usuario en sesión no encontrado en la BD")));
        Badge savedBadge = badgeRepository.save(badge);

        log.info("Nuevo Badge registrado con éxito. UUID: {}", savedBadge.getUuid());
        return badgeMapper.toDTO(savedBadge);
    }

    private String saveFile(MultipartFile file) {
        try {
            // Aseguramos que el directorio exista
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }

            // Mantenemos la extensión original de forma segura
            String originalFilename = file.getOriginalFilename();
            String extension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";

            String fileName = UUID.randomUUID().toString() + extension;
            Path destinationFile = rootLocation.resolve(fileName);

            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException e) {
            log.error("Fallo crítico al guardar archivo: {}", e.getMessage());
            throw new RuntimeException("Error en el sistema de almacenamiento de archivos.");
        }
    }
}
