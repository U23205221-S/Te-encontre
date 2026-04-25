package org.sync_astra.backendjava.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDTO {


    private String dni;

    private String email;
    private String passwordHash;

    // Incluido específicamente para que coincida con la validación de tu AuthService
    private String confirmPasswordHash;
}