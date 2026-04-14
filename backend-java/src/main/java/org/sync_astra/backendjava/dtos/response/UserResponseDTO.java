package org.sync_astra.backendjava.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {

    private Long id;

    private UUID uuid;

    private String userName;

    private String dni;

    private Instant createdAt;

    private Instant updatedAt;

    // Nota: Las listas de 'badges' y 'scanAlerts' se omiten intencionalmente aquí
    // para evitar payloads JSON gigantes o problemas de recursividad.
    // Es mejor manejarlos con endpoints y DTOs independientes si necesitas listarlos.
}
