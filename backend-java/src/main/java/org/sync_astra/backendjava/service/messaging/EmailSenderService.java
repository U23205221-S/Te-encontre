package org.sync_astra.backendjava.service.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSenderService {
    private final JavaMailSender mailSender;

    @Async // <--- Ahora sí funcionará en un hilo aparte (o Virtual Thread)
    public void sendEmailAsync(String to, String subject, String body) {
        try {
            log.info("Iniciando envío asíncrono de mail a: {}", to);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email enviado exitosamente a: {}", to);
        } catch (Exception e) {
            log.error("Error crítico enviando email a {}: {}", to, e.getMessage());
        }
    }
}
