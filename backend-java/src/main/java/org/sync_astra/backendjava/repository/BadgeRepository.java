package org.sync_astra.backendjava.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.sync_astra.backendjava.model.Badge;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {

    // Buscar por el UUID que vendrá en el código QR
    Optional<Badge> findByUuid(UUID uuid);

    // Proyección para la búsqueda vectorial rápida
    interface BadgeMatchResult {
        Long getId();
        Double getDistance();
    }

    @Query(value = """
        SELECT id, (face_vector <-> CAST(:embedding AS vector)) as distance
        FROM badge 
        ORDER BY distance 
        LIMIT 1
        """, nativeQuery = true)
    Optional<BadgeMatchResult> findBestMatch(@Param("embedding") float[] embedding);
}
