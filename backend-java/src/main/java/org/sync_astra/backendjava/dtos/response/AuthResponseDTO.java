package org.sync_astra.backendjava.dtos.response;

import lombok.*;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String fullName;
}
