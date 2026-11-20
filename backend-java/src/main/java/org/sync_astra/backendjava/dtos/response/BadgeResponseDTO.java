package org.sync_astra.backendjava.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.model.Categories.Gender;
import org.sync_astra.backendjava.model.Categories.StatusBadge;
import org.sync_astra.backendjava.model.Guardians;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeResponseDTO {
    // Exponemos el UUID público (seguro) en lugar del ID secuencial interno de la BD
    private UUID uuid;

    private String dni;
    private String fullName;
    private Instant dateOfBirth;
    private Gender gender;

    private String photoUrl;
    private StatusBadge statusBadge;

    // Fechas de auditoría útiles para mostrar en el Frontend (Ej: "Registrado el...")
    private Instant createdAt;
    private Instant updatedAt;

    private List<GuardiansResponseDTO> guardians;

    // ELIMINADO: faceVector.
    // Nunca devuelvas el vector de IA al cliente en un CRUD normal,
    // pesa mucho y el frontend solo necesita la foto (String) para mostrar la cara.
}
