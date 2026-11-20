package org.sync_astra.backendjava;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.sync_astra.backendjava.model.NotificationAudit;
import org.sync_astra.backendjava.repository.NotificationAuditRepository;
import org.sync_astra.backendjava.service.email.EmailOrchestratorService;
import org.sync_astra.backendjava.service.email.ResendEmailService;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailOrchestratorServiceTest {

    @Mock private ResendEmailService resendEmailService;
    @Mock private NotificationAuditRepository notificationAuditRepository;

    private EmailOrchestratorService emailOrchestratorService;

    @BeforeEach
    void setUp() {
        emailOrchestratorService = new EmailOrchestratorService(resendEmailService, notificationAuditRepository);
        when(notificationAuditRepository.save(any(NotificationAudit.class))).thenAnswer(inv -> {
            NotificationAudit audit = inv.getArgument(0);
            audit.setId(42L);
            return audit;
        });
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void sendManageEmail_defersAsyncDispatchUntilAfterCommitWhenTransactionActive() {
        TransactionSynchronizationManager.initSynchronization();
        UUID entityUuid = UUID.randomUUID();

        emailOrchestratorService.sendManageEmail("GUARDIANS", entityUuid, "test@example.com", "Subject", "<p>Hi</p>", "PRIMARY_GUARDIAN");

        verify(notificationAuditRepository, times(1)).save(any(NotificationAudit.class));
        verify(resendEmailService, never()).sendEmail(any(), anyString(), anyString(), anyString());

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCommit();
        }

        verify(resendEmailService, times(1))
                .sendEmail(argThat(a -> a.getId().equals(42L)), eq("test@example.com"), eq("Subject"), eq("<p>Hi</p>"));
    }

    @Test
    void sendManageEmail_doesNotDispatchWhenTransactionRollsBack() {
        TransactionSynchronizationManager.initSynchronization();

        emailOrchestratorService.sendManageEmail("GUARDIANS", UUID.randomUUID(), "test@example.com", "Subject", "<p>Hi</p>", "PRIMARY_GUARDIAN");

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }

        verify(resendEmailService, never()).sendEmail(any(), anyString(), anyString(), anyString());
    }

    @Test
    void sendManageEmail_dispatchesImmediatelyWhenNoTransactionSynchronizationActive() {
        emailOrchestratorService.sendManageEmail("GUARDIANS", UUID.randomUUID(), "test@example.com", "Subject", "<p>Hi</p>");

        verify(resendEmailService, times(1))
                .sendEmail(argThat(a -> a.getId().equals(42L)), eq("test@example.com"), eq("Subject"), eq("<p>Hi</p>"));
    }
}
