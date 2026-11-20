package org.sync_astra.backendjava.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.sync_astra.backendjava.model.ConsentAudit;

@Repository
public interface ConsentAuditRepository extends JpaRepository<ConsentAudit, Long> {
}
