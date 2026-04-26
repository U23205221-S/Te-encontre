package org.sync_astra.backendjava.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.model.Categories.Gender;
import org.sync_astra.backendjava.model.Categories.RelationShip;
import org.sync_astra.backendjava.model.Categories.StatusBadge;
import org.sync_astra.backendjava.util.ValidateGroup;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeRequestDTO {
    // Se omiten id, uuid, createdAt y updatedAt porque los genera el Backend/Base de datos.
    @NotBlank(message = "El campo dni es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Size(min = 8, max = 8, message = "El campo dni debe tener exactamente 8 caracteres",
            groups = {ValidateGroup.OnCreate.class})
    private String dni;

    @NotBlank(message = "El campo fullName es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Size(min = 3, max = 50, message = "El campo fullName debe tener entre 3 y 50 caracteres",
            groups = {ValidateGroup.OnCreate.class})
    private String fullName;

    @NotNull(message = "El campo dateOfBirth es obligatorio", groups = {ValidateGroup.OnCreate.class})
    private Instant dateOfBirth;

    @NotNull(message = "El campo gender es obligatorio", groups = {ValidateGroup.OnCreate.class})
    private Gender gender;

    @NotBlank(message = "El campo bloodType es obligatorio", groups = {ValidateGroup.OnCreate.class})
    private String bloodType;

    @NotBlank(message = "El campo allergies es obligatorio, si no tiene alergias, indique 'Ninguna'",
            groups = {ValidateGroup.OnCreate.class})
    private String allergies;

    @Null(message = "El campo relationShip no debe ser proporcionado por el cliente, se establecerá automáticamente",
            groups = {ValidateGroup.OnCreate.class})
    private String photoUrl;

    @NotNull(message = "El campo faceVector es obligatorio", groups = {ValidateGroup.OnCreate.class})
    @Size(min = 128, max = 128, message = "El vector facial debe contener exactamente 128 puntos",
            groups = {ValidateGroup.OnCreate.class})
    private float[] faceVector;

    @Null(message = "El campo statusBadge no debe ser proporcionado por el cliente, se establecerá automáticamente",
            groups = {ValidateGroup.OnCreate.class})
    private StatusBadge statusBadge;


    @Valid
    @NotNull(message = "La lista de tutores no puede ser nula", groups = {ValidateGroup.OnCreate.class})
    @Size(min = 2, message = "Debe proporcionar al menos un tutor legal y un auxiliar (mínimo 2 registros)",
            groups = {ValidateGroup.OnCreate.class})
    private List<GuardiansRequestDTO> guardians;
}
