package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.model.Categories.RelationShip;
import org.sync_astra.backendjava.util.ValidateGroup;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardiansRequestDTO {

    @NotBlank(message = "El campo dni es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Size(min = 8, max = 8, message = "El campo dni debe tener entre 8",
            groups = {ValidateGroup.OnCreate.class})
    private String dni;

    @NotBlank(message = "El campo name es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Size(min = 3, max = 50, message = "El campo name debe tener entre 3 y 50 caracteres",
            groups = {ValidateGroup.OnCreate.class})
    private String name;

    @NotBlank(message = "El campo email es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Email(message = "Debe ser una dirección de correo electrónico válida", groups = {ValidateGroup.OnCreate.class})
    private String email;

    @NotBlank(message = "El campo teléfono es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Pattern(
            regexp = "^9[0-9]{8}$",
            message = "El número de teléfono debe ser de Perú (iniciar con 9 y tener exactamente 9 dígitos)",
            groups = {ValidateGroup.OnCreate.class}
    )
    private String phone;

    @NotNull(message = "El campo relationship es obligatorio", groups = {ValidateGroup.OnCreate.class})
    private RelationShip relationship;
}
