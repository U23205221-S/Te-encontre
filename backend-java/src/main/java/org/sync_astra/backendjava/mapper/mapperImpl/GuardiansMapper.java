package org.sync_astra.backendjava.mapper.mapperImpl;

import org.mapstruct.Mapper;
import org.sync_astra.backendjava.config.GlobalMapperConfig;
import org.sync_astra.backendjava.dtos.request.GuardiansRequestDTO;
import org.sync_astra.backendjava.dtos.response.GuardiansResponseDTO;
import org.sync_astra.backendjava.mapper.convert.Convert;
import org.sync_astra.backendjava.mapper.convert.UpdatePatch;
import org.sync_astra.backendjava.model.Guardians;

@Mapper(config = GlobalMapperConfig.class)
public interface GuardiansMapper extends Convert<Guardians, GuardiansRequestDTO, GuardiansResponseDTO> , UpdatePatch<GuardiansRequestDTO, Guardians> {


    @Override
    GuardiansResponseDTO toDTO(Guardians model);

    @Override
    Guardians toModel(GuardiansRequestDTO dto);

    // Nota: El método "updateFromDto" ya se hereda automáticamente de la interfaz UpdatePatch.
    // No necesitas declararlo aquí con @MappingTarget, ya que la abstracción hace el trabajo.

}
