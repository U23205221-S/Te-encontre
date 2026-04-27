package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.util.ValidateGroup;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanAlertRequestDTO {

    @NotNull(message = "El campo qrCodeUuid es obligatorio para el escaneo por QR",
            groups = ValidateGroup.OnScanQR.class)
    @Null(message = "El campo qrCodeUuid no debe ser proporcionado para el escaneo facial",
            groups = ValidateGroup.OnScanFace.class)
    private UUID qrCodeUuid;

    @NotNull(message = "El campo faceVector es obligatorio para el escaneo facial",
            groups = ValidateGroup.OnScanFace.class)
    @Null(message = "El campo faceVector no debe ser proporcionado para el escaneo por QR",
            groups = ValidateGroup.OnScanQR.class)
    @Size(min = 128, max = 128, message = "El vector facial debe contener exactamente 128 puntos",
            groups = {ValidateGroup.OnScanFace.class})
    private float[] faceVector;

    @NotNull(message = "El campo latitude es obligatorio",
            groups = {ValidateGroup.OnScanQR.class, ValidateGroup.OnScanFace.class})
    private Double latitude;

    @NotNull(message = "El campo longitude es obligatorio",
            groups = {ValidateGroup.OnScanQR.class, ValidateGroup.OnScanFace.class})
    private Double longitude;

    @Null(message = "El campo dniReporter no debe ser proporcionado por el cliente, se establecerá automáticamente",
            groups = {ValidateGroup.OnScanQR.class, ValidateGroup.OnScanFace.class})
    private String dniReporter;

    @Null(message = "El campo fullNameReporter no debe ser proporcionado por el cliente, se establecerá automáticamente",
            groups = {ValidateGroup.OnScanQR.class, ValidateGroup.OnScanFace.class})
    private String fullNameReporter;

    @Null(message = "El campo phoneReporter no debe ser proporcionado por el cliente, se establecerá automáticamente",
            groups = {ValidateGroup.OnScanQR.class, ValidateGroup.OnScanFace.class})
    private String phoneReporter;

    @NotBlank(message = "El campo nameDevice es obligatorio",
            groups = {ValidateGroup.OnScanQR.class, ValidateGroup.OnScanFace.class})
    private String nameDevice;

    @Null(message = "El campo photoReport no debe ser proporcionado por el cliente, se establecerá automáticamente",
            groups = {ValidateGroup.OnScanQR.class, ValidateGroup.OnScanFace.class})
    private String photoReport;

    @NotBlank(message = "El campo ipAddress es obligatorio",
            groups = {ValidateGroup.OnScanQR.class, ValidateGroup.OnScanFace.class})
    private String ipAddress;
}

