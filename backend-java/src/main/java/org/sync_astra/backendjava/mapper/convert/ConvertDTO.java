package org.sync_astra.backendjava.mapper.convert;

public interface ConvertDTO <M,D>{
    D toDTO(M model);
}
