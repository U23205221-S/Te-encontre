package org.sync_astra.backendjava.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanAlterResponseDTO {

    private String dniReporter;

    private String fullNameReporter;

    private String phoneReporter;

    private String nameDevice;

    private String photoReport;

    private String ipAddress;
}
