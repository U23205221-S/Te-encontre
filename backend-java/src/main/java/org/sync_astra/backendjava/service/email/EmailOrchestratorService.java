package org.sync_astra.backendjava.service.email;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.sync_astra.backendjava.model.Categories.StatusEmail;
import org.sync_astra.backendjava.model.NotificationAudit;
import org.sync_astra.backendjava.repository.NotificationAuditRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailOrchestratorService {
    private final ResendEmailService resendEmailService;
    private final NotificationAuditRepository notificationAuditRepository;

    public void sendManageEmail(String entity, UUID entityUuid, String to, String subject, String htmlContent) {
        NotificationAudit audit = NotificationAudit.builder()
                .entity(entity)
                .entityUuid(entityUuid)
                .emailSend(to)
                .status(StatusEmail.PENDIENTE)
                .build();
        audit = notificationAuditRepository.save(audit);

        resendEmailService.sendEmail(audit, to, subject, htmlContent);
    }
}
