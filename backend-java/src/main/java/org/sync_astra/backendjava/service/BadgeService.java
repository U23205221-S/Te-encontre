package org.sync_astra.backendjava.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.mapper.mapperImpl.BadgeMapper;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.repository.BadgeRepository;

import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class BadgeService {
    private final BadgeRepository badgeRepository;
    private final BadgeMapper badgeMapper;
    private static final double MATCH_THRESHOLD = 0.6; // Ajustar según precisión del modelo

    // IDENTIFICACIÓN POR ROSTRO: Devuelve el DTO completo si hay match
    @Transactional(readOnly = true)
    public Optional<BadgeResponseDTO> identifyByFace(float[] vector) {
        return badgeRepository.findBestMatch(vector)
                .filter(result -> result.getDistance() < MATCH_THRESHOLD)
                .flatMap(result -> badgeRepository.findById(result.getId()))
                .map(badgeMapper::toDTO);
    }

    // BÚSQUEDA POR QR (UUID): Devuelve el DTO completo
    @Transactional(readOnly = true)
    public BadgeResponseDTO getByUuid(UUID uuid) {
        return badgeRepository.findByUuid(uuid)
                .map(badgeMapper::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Badge no encontrado para el UUID: " + uuid));
    }

    /**
     * REGISTRO: Crea un nuevo badge con su vector facial.
     */
    @Transactional
    public BadgeResponseDTO create(BadgeRequestDTO requestDTO) {
        // Convertimos el DTO a Entidad (MapStruct se encarga de todo)
        Badge badge = badgeMapper.toModel(requestDTO);

        // Guardamos en la BD (Genera ID, UUID, CreatedAt automáticamente)
        Badge savedBadge = badgeRepository.save(badge);

        // Retornamos el DTO de respuesta
        return badgeMapper.toDTO(savedBadge);
    }
}
