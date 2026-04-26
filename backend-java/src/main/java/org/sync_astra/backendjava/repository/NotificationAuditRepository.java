package org.sync_astra.backendjava.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.sync_astra.backendjava.model.NotificationAudit;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationAuditRepository extends JpaRepository<NotificationAudit, Long> {
    Optional<NotificationAudit> findByUuid(UUID uuid);
}
