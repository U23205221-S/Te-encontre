package org.sync_astra.backendjava.service.email;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
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
        sendManageEmail(entity, entityUuid, to, subject, htmlContent, null);
    }

    public void sendManageEmail(String entity, UUID entityUuid, String to, String subject, String htmlContent, String recipientRole) {
        NotificationAudit audit = NotificationAudit.builder()
                .entity(entity)
                .entityUuid(entityUuid)
                .emailSend(to)
                .recipientRole(recipientRole)
                .status(StatusEmail.PENDIENTE)
                .build();
        NotificationAudit savedAudit = notificationAuditRepository.save(audit);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    resendEmailService.sendEmail(savedAudit, to, subject, htmlContent);
                }
            });
        } else {
            resendEmailService.sendEmail(savedAudit, to, subject, htmlContent);
        }
    }
}
