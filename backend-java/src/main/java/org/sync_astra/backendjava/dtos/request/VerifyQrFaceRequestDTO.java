package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyQrFaceRequestDTO {

    @NotNull(message = "El campo qrCodeUuid es obligatorio")
    private UUID qrCodeUuid;

    @NotNull(message = "El vector facial es obligatorio")
    @Size(min = 128, max = 128, message = "El vector facial debe contener exactamente 128 puntos")
    private float[] faceVector;
}
