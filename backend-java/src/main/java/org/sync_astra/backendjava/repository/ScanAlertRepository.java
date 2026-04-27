package org.sync_astra.backendjava.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.sync_astra.backendjava.model.ScanAlert;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScanAlertRepository extends JpaRepository<ScanAlert, Long> {
    Optional<ScanAlert> findByUuid(UUID uuid);
}

