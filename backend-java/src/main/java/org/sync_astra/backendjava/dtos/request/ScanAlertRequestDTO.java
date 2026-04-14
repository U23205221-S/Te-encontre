package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanAlertRequestDTO {

    @NotBlank(message = "El qrCodeId es obligatorio")
    private String qrCodeUuid;

    private float[] faceVector;

    @NotNull(message = "La latitud es obligatoria")
    private Double latitude;

    @NotNull(message = "La longitud es obligatoria")
    private Double longitude;
}

