package org.sync_astra.backendjava.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.model.Categories.Gender;
import org.sync_astra.backendjava.model.Categories.RelationShip;
import org.sync_astra.backendjava.model.Categories.StatusBadge;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeRequestDTO {
    // Se omiten id, uuid, createdAt y updatedAt porque los genera el Backend/Base de datos.

    private String dni;
    private String fullName;
    private Instant dateOfBirth;
    private Gender gender;
    private String bloodType;
    private String allergies;
    private String photoUrl;
    // Lo pedimos en el request asumiendo que al crear el usuario,
    // el frontend/Python te enviará el vector generado para guardarlo.
    private float[] faceVector;
    private StatusBadge statusBadge;


    //Comenzamos con los atributos de Entidad Guardianship
    //Opcional al modificar el badge, pero lo dejamos para que se pueda modificar el tutor legal.
    private List<GuardiansRequestDTO> guardians;
}
