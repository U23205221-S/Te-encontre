package org.sync_astra.backendjava.service.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSenderService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:sync.astra0@gmail.com}")
    private String fromEmail;

    @Async
    public CompletableFuture<Boolean> sendEmailAsync(String to, String subject, String body) {
        try {
            log.info("Iniciando envío asíncrono de mail a: {}", to);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email enviado exitosamente a: {}", to);
            return CompletableFuture.completedFuture(true);
        } catch (MailException e) {
            log.error("Error crítico enviando email a {}: {}", to, e.getMessage());
            throw e; // Lanzamos la excepción para que el llamador pueda capturarla en el CompletableFuture
        } catch (Exception e) {
            log.error("Error inesperado enviando email a {}: {}", to, e.getMessage());
            throw new RuntimeException("Error inesperado en el envío de correo", e);
        }
    }
}
