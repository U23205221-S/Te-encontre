package org.sync_astra.backendjava.service.apiCloud;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DniResponse {
    private boolean success;
    private DatosDni datos;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DatosDni {
        private String nombres;

        @JsonProperty("ape_paterno")
        private String apellidoPaterno;

        @JsonProperty("ape_materno")
        private String apellidoMaterno;
    }
}
