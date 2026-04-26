package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.util.ValidateGroup;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDTO {

    @NotBlank(message = "El nombre de usuario no puede estar vacío", groups = {ValidateGroup.OnCreate.class})
    private String dni;

    @NotBlank(message = "El correo electrónico es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Email(message = "Debe ser una dirección de correo electrónico válida", groups = {ValidateGroup.OnCreate.class})
    private String email;

    @NotBlank(message = "La contraseña es obligatoria", groups = {ValidateGroup.OnCreate.class})
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.]).{8,}$",
            message = "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una minúscula, un número y un carácter especial",
            groups = {ValidateGroup.OnCreate.class}
    )
    private String passwordHash;

    // Incluido específicamente para que coincida con la validación de tu AuthService
    @NotBlank(message = "La confirmación de contraseña es obligatoria", groups = {ValidateGroup.OnCreate.class})
    private String confirmPasswordHash;
}