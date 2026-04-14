package org.sync_astra.backendjava.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.model.Categories.Gender;
import org.sync_astra.backendjava.model.Categories.StatusBadge;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeRequestDTO {
    // Se omiten id, uuid, createdAt y updatedAt porque los genera el Backend/Base de datos.

    private String fullName;
    private int age;
    private Gender gender;
    private String bloodType;
    private String allergies;
    private String emergencyContactName;
    private String mainEmergencyPhone;
    private String alternativeEmergencyPhone;
    private String photo;
    private StatusBadge statusBadge;

    // Lo pedimos en el request asumiendo que al crear el usuario,
    // el frontend/Python te enviará el vector generado para guardarlo.
    private float[] faceVector;
}
