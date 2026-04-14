package org.sync_astra.backendjava.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.model.Badge;
import org.sync_astra.backendjava.model.ScanAlert;
import org.sync_astra.backendjava.repository.BadgeRepository;
import org.sync_astra.backendjava.repository.ScanAlertRepository;
import org.sync_astra.backendjava.service.messaging.EmailSenderService;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanAlertService {

    private final ScanAlertRepository scanAlertRepository;
    private final BadgeRepository badgeRepository;
    private final EmailSenderService emailSenderService;

    @Value("${app.alert.group-email:admin@teencontre.com}")
    private String alertGroupEmail;

    @Transactional
    public void createAlert(ScanAlertRequestDTO request) {
        log.info("Registrando alerta de escaneo para QR: {}", request.getQrCodeUuid());

        // 1. Validar y buscar a la persona (Badge/Child) asociada
        UUID badgeUuid;
        try {
            badgeUuid = UUID.fromString(request.getQrCodeUuid());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El ID del QR no es un UUID válido.");
        }

        Badge badge = badgeRepository.findByUuid(badgeUuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe registro para el QR especificado."));

        String targetEmail = badge.getUserParent().getUserName();
        if (targetEmail == null || targetEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay correo registrado del padre o tutor para enviar la alerta.");
        }

        // 2. Crea la entidad con emailSent = false
        ScanAlert alert = ScanAlert.builder()
                .badge(badge)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .scanByUser(badge.getUserParent()) //Se tiene que utilizar el mainUser para actualizar este parametro en el futuro, pero por ahora se utiliza el userParent para no complicar la lógica de búsqueda del usuario que escaneó el QR
                .emailSent(false)
                .build();

        // 3. Guarda la entidad en BD (Primer commit de auditoría)
        alert = scanAlertRepository.saveAndFlush(alert);

        String googleMapsLink = String.format("https://www.google.com/maps?q=%s,%s",
                request.getLatitude(), request.getLongitude());

        String subject = "¡ALERTA DE UBICACIÓN! - Tu familiar ha sido localizado";
        String body = """
                Hola, se ha detectado actividad (escaneo de QR o reconocimiento facial) de tu familiar en la siguiente ubicación: %s
                Por favor, verifica el estado de seguridad inmediatamente.
                """.formatted(googleMapsLink);

        // 4. Intenta enviar el correo
        try {
            CompletableFuture<Boolean> emailFuture = emailSenderService.sendEmailAsync(targetEmail, subject, body);
            // Obtenemos el resultado (bloquea de forma segura dentro del timeout por defecto o espera a que termine)
            Boolean result = emailFuture.join();

            if (Boolean.TRUE.equals(result)) {
                alert.setEmailSent(true);
            }
        } catch (Exception e) {
            log.error("Fallo al enviar correo de alerta: {}", e.getMessage());
            alert.setEmailSent(false);
            // Extraer el mensaje real de la excepción (join() envuelve las excepciones en CompletionException)
            String errorMsg = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            alert.setEmailErrorLog(errorMsg);
        }

        // 5. Guarda los cambios de la entidad en BD (Segundo commit de auditoría)
        scanAlertRepository.save(alert);
    }
}
