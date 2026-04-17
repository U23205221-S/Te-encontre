package org.sync_astra.backendjava.service.messaging;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResendEmailService {

    private final Resend resend;

    @Async
    public CompletableFuture<Boolean> sendEmail(String to, String subject, String htmlContent) {
        log.info("Iniciando envío asíncrono de mail a: {}", to);

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    // RECUERDA: Usar onboarding@resend.dev para pruebas o un dominio propio verificado
                    .from("Acme  <sync.astra0@gmail.com>")
                    .to(to)
                    .subject(subject)
                    .html(htmlContent)
                    .build();

            CreateEmailResponse data = resend.emails().send(params);

            // Unificamos el log de éxito con el ID de Resend
            log.info("Email enviado exitosamente a: {}. ID de Resend: {}", to, data.getId());

            return CompletableFuture.completedFuture(true);

        } catch (ResendException e) {
            // Logueamos el error usando SLF4J, pasando la excepción entera al final para ver el StackTrace en consola
            log.error("Fallo de la API de Resend enviando email a {}: {}", to, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);

        } catch (Exception e) {
            // Red de seguridad para cualquier otro error inesperado (red, nulos, etc.)
            log.error("Error inesperado en el hilo asíncrono enviando email a {}: {}", to, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);
        }
    }
}