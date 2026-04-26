package org.sync_astra.backendjava.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ScanAlertPart2RequestDTO {
    private String dniReporter;
    private String phoneReporter;
}
