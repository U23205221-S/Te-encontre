package org.sync_astra.backendjava.mapper.convert;

public interface ConvertModel <M,D>{
    M toModel(D dto);
}
