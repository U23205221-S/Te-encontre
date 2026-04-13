package org.sync_astra.backendjava.mapper.mapperImpl;

import org.mapstruct.Mapper;
import org.sync_astra.backendjava.config.GlobalMapperConfig;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.mapper.convert.Convert;
import org.sync_astra.backendjava.mapper.convert.UpdatePatch;
import org.sync_astra.backendjava.model.Badge;

/**
 * Mapper para la entidad Badge.
 * - Utiliza la configuración global (GlobalMapperConfig) para inyección de dependencias de Spring e ignorar nulos.
 * - Extiende Convert para heredar los métodos toDTO y toModel.
 * - Extiende UpdatePatch para heredar el método de actualización parcial (updateFromDto).
 */
@Mapper(config = GlobalMapperConfig.class)
public interface BadgeMapper extends Convert<Badge, BadgeRequestDTO, BadgeResponseDTO>, UpdatePatch<BadgeRequestDTO, Badge> {

    @Override
    BadgeResponseDTO toDTO(Badge model);

    @Override
    Badge toModel(BadgeRequestDTO dto);

    // Nota: El método "updateFromDto" ya se hereda automáticamente de la interfaz UpdatePatch.
    // No necesitas declararlo aquí con @MappingTarget, ya que la abstracción hace el trabajo.
}