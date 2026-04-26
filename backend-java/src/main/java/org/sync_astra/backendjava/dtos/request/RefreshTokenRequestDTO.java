package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.util.ValidateGroup;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RefreshTokenRequestDTO {
    @NotBlank(message = "El refresh token no puede estar vacío", groups = {ValidateGroup.OnCreate.class})
    private String refreshToken;
}
