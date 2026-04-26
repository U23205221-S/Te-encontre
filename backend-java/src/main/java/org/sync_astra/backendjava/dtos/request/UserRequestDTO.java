package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.constraints.*;
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

    @NotBlank(message = "El nombre de usuario no puede estar vacío", groups = {ValidateGroup.OnCreate.class,
            ValidateGroup.OnLogin.class})
    @Size(min = 8, max = 8, message = "El dni debe tener entre 8 caracteres",
            groups = {ValidateGroup.OnCreate.class, ValidateGroup.OnLogin.class})
    private String dni;

    @NotBlank(message = "El correo electrónico es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Email(message = "Debe ser una dirección de correo electrónico válida", groups = {ValidateGroup.OnCreate.class})
    @Null(message = "El campo email no debe ser proporcionado por el cliente",
            groups = {ValidateGroup.OnLogin.class})
    private String email;

    @NotBlank(message = "La contraseña es obligatoria", groups = {ValidateGroup.OnCreate.class,
            ValidateGroup.OnLogin.class})
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.]).{8,}$",
            message = "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una minúscula, un número y un carácter especial",
            groups = {ValidateGroup.OnCreate.class}
    )
    @Size(min = 8, max = 15, message = "La contraseña debe tener entre 8 y 15 caracteres",
            groups = {ValidateGroup.OnCreate.class, ValidateGroup.OnLogin.class})
    private String passwordHash;

    // Incluido específicamente para que coincida con la validación de tu AuthService
    @NotBlank(message = "La confirmación de contraseña es obligatoria", groups = {ValidateGroup.OnCreate.class})
    @Null(message = "El campo confirmPasswordHash no debe ser proporcionado por el cliente, se utilizará solo para validación",
            groups = {ValidateGroup.OnLogin.class})
    private String confirmPasswordHash;
}