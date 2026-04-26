package org.sync_astra.backendjava.mapper.mapperImpl;

import org.mapstruct.Mapper;
import org.sync_astra.backendjava.config.GlobalMapperConfig;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.response.ScanAlterResponseDTO;
import org.sync_astra.backendjava.mapper.convert.Convert;
import org.sync_astra.backendjava.mapper.convert.UpdatePatch;
import org.sync_astra.backendjava.model.ScanAlert;

@Mapper(config = GlobalMapperConfig.class)
public interface ScanAlertMapper extends Convert<ScanAlert, ScanAlertRequestDTO, ScanAlterResponseDTO>, UpdatePatch<ScanAlertRequestDTO,ScanAlert> {

    @Override
    ScanAlterResponseDTO toDTO(ScanAlert model);

    @Override
    ScanAlert toModel(ScanAlertRequestDTO dto);

     // El método "updateFromDto" ya se hereda automáticamente de la interfaz UpdatePatch.
     // No necesitas declararlo aquí con @MappingTarget, ya que la abstracción hace el trabajo.
}
