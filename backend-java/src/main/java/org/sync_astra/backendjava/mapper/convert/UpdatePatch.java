package org.sync_astra.backendjava.mapper.convert;

import org.mapstruct.BeanMapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

public interface UpdatePatch<DRQ, T> {
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(DRQ dto, @MappingTarget T entity);
}
