package org.sync_astra.backendjava.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.sync_astra.backendjava.model.Categories.AlertStatus;
import org.sync_astra.backendjava.model.ScanAlert;
import org.sync_astra.backendjava.model.Users;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScanAlertRepository extends JpaRepository<ScanAlert, Long> {
    Optional<ScanAlert> findByUuid(UUID uuid);

    @Query("""
        SELECT DISTINCT a FROM ScanAlert a
        LEFT JOIN FETCH a.badge b
        LEFT JOIN FETCH b.guardians
        LEFT JOIN FETCH b.userRegister
        WHERE a.uuid = :uuid
    """)
    Optional<ScanAlert> findWithBadgeByUuid(@Param("uuid") UUID uuid);

    @Query("""
        SELECT DISTINCT a FROM ScanAlert a
        LEFT JOIN FETCH a.badge b
        LEFT JOIN FETCH b.guardians
        WHERE a.id = :id
    """)
    Optional<ScanAlert> findWithBadgeAndGuardiansById(@Param("id") Long id);

    Optional<ScanAlert> findByConfirmationToken(UUID confirmationToken);

    List<ScanAlert> findByBadge_UserRegisterOrderByScannedAtDesc(Users userRegister);

    @Query("SELECT a FROM ScanAlert a WHERE a.status = :activeStatus AND a.expiresAt <= :now")
    List<ScanAlert> findExpiredActiveAlerts(
            @Param("activeStatus") AlertStatus activeStatus,
            @Param("now") Instant now
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ScanAlert a
        SET a.status = :confirmedStatus,
            a.confirmedAt = :now,
            a.confirmedByDni = :actorDni
        WHERE a.uuid = :alertUuid
          AND a.status IN :confirmableStatuses
    """)
    int markConfirmedIfConfirmable(
            @Param("alertUuid") UUID alertUuid,
            @Param("confirmableStatuses") List<AlertStatus> confirmableStatuses,
            @Param("confirmedStatus") AlertStatus confirmedStatus,
            @Param("now") Instant now,
            @Param("actorDni") String actorDni
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ScanAlert a
        SET a.status = :escalatedStatus,
            a.escalatedAt = :now
        WHERE a.id = :alertId
          AND a.status = :activeStatus
    """)
    int markEscalatedIfActive(
            @Param("alertId") Long alertId,
            @Param("activeStatus") AlertStatus activeStatus,
            @Param("escalatedStatus") AlertStatus escalatedStatus,
            @Param("now") Instant now
    );
}
