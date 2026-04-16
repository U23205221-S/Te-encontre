package org.sync_astra.backendjava.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.ScanAlert;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.ScanAlertRepository;
import org.sync_astra.backendjava.service.messaging.ResendEmailService;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanAlertService {

    private final ScanAlertRepository scanAlertRepository;
    private final ResendEmailService resendEmailService;

    @Value("${app.alert.group-email:admin@teencontre.com}")
    private String alertGroupEmail;

    // Usamos REQUIRES_NEW para que el guardado de la alerta sea independiente
    // y no afecte la transacción principal de búsqueda si algo falla.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processAndSendAlert(Badge badge, Double latitude, Double longitude, Users scannerUser) {
        log.info("Registrando alerta de escaneo para el Badge ID: {}", badge.getId());

        String targetEmail = badge.getUserParent().getUserName();
        if (targetEmail == null || targetEmail.isBlank()) {
            log.warn("No hay correo registrado del padre o tutor para el Badge ID {}. No se enviará alerta.", badge.getId());
            return; // Salimos sin romper el flujo
        }

        // 1. Crea la entidad con emailSent = false
        ScanAlert alert = ScanAlert.builder()
                .badge(badge)
                .latitude(latitude)
                .longitude(longitude)
                .scanByUser(scannerUser) // Ojo con este TODO que dejaste en tu código original
                .emailSent(false)
                .build();

        // 2. Guarda la entidad en BD
        alert = scanAlertRepository.saveAndFlush(alert);

        // Corregido el enlace de Google Maps para usar lat y lon reales
        String googleMapsLink = String.format("https://www.google.com/maps?q=%s,%s", latitude, longitude);

        String subject = "¡ALERTA DE UBICACIÓN! - Tu familiar ha sido localizado";
        String body = """
                Hola, se ha detectado actividad (escaneo de QR o reconocimiento facial) de tu familiar en la siguiente ubicación:
                %s
                
                Por favor, verifica el estado de seguridad inmediatamente.
                """.formatted(googleMapsLink);

        // 3. Intenta enviar el correo
        try {
            CompletableFuture<Boolean> emailFuture = resendEmailService.sendEmail(targetEmail, subject, body);
            Boolean result = emailFuture.join();

            if (Boolean.TRUE.equals(result)) {
                alert.setEmailSent(true);
            }
        } catch (Exception e) {
            log.error("Fallo al enviar correo de alerta: {}", e.getMessage());
            alert.setEmailSent(false);
            String errorMsg = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            alert.setEmailErrorLog(errorMsg);
        }

        // 4. Actualiza la alerta con el estado del correo
        scanAlertRepository.save(alert);
    }
}
