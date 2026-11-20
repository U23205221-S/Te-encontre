package org.sync_astra.backendjava.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AlertEscalationScheduler {

    private final ScanAlertService scanAlertService;

    @Scheduled(fixedDelay = 5000)
    public void escalateExpiredAlerts() {
        int escalated = scanAlertService.processExpiredAlerts();
        if (escalated > 0) {
            log.info("Escalamiento automático ejecutado para {} alerta(s) vencida(s).", escalated);
        }
    }
}
