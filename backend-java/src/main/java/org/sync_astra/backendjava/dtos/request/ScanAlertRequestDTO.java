package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanAlertRequestDTO {

    private UUID qrCodeUuid;

    private float[] faceVector;

    private Double latitude;

    private Double longitude;

    private String dniReporter;

    private String fullNameReporter;

    private String phoneReporter;

    private String nameDevice;

    private String photoReport;

    private String ipAddress;
}

