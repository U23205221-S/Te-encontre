package org.sync_astra.backendjava.mapper.mapperImpl;

import org.mapstruct.Mapper;
import org.sync_astra.backendjava.config.GlobalMapperConfig;
import org.sync_astra.backendjava.dtos.request.UserRequestDTO;
import org.sync_astra.backendjava.dtos.response.UserResponseDTO;
import org.sync_astra.backendjava.mapper.convert.Convert;
import org.sync_astra.backendjava.model.Users;

@Mapper(config = GlobalMapperConfig.class)
public interface UserMapper extends Convert<Users, UserRequestDTO, UserResponseDTO> {

    @Override
    UserResponseDTO toDTO(Users model);

    @Override
    Users toModel(UserRequestDTO dto);

        // Nota: El método "updateFromDto" ya se hereda automáticamente de la interfaz UpdatePatch.
        // No necesitas declararlo aquí con @MappingTarget, ya que la abstracción hace el trabajo.
}
