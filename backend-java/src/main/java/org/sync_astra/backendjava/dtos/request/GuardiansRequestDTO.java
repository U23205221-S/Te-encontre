package org.sync_astra.backendjava.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sync_astra.backendjava.model.Categories.RelationShip;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardiansRequestDTO {
    private String dni;
    private String name;
    private String email;
    private String phone;
    private RelationShip relationship;
}
