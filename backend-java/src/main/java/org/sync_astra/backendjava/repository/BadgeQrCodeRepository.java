package org.sync_astra.backendjava.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.sync_astra.backendjava.model.BadgeQrCode;
import org.sync_astra.backendjava.model.Categories.QrCodeStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BadgeQrCodeRepository extends JpaRepository<BadgeQrCode, Long> {
    Optional<BadgeQrCode> findByQrToken(UUID qrToken);

    Optional<BadgeQrCode> findFirstByBadgeIdAndStatusOrderByCreatedAtDesc(Long badgeId, QrCodeStatus status);

    List<BadgeQrCode> findByBadgeIdOrderByCreatedAtDesc(Long badgeId);
}
