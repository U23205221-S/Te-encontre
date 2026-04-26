package org.sync_astra.backendjava.service.apiCloud;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class DniService {

    private final RestTemplate restTemplate = new RestTemplate();
    @Value("${mi-api-cloud.url}")
    private String API_URL;
    @Value("${mi-api-cloud.token}")
    private String BEARER_TOKEN; // Recomiendo usar @Value desde application.properties

    /**
     * MÉTODO 1: Devuelve un booleano para validaciones rápidas.
     */
    public boolean existeDni(String dni) {
        log.info("Validando existencia de DNI: {}", dni);
        DniResponse response = realizarPeticion(dni);
        return response != null && response.isSuccess() && response.getDatos() != null;
    }

    /**
     * MÉTODO 2: Devuelve los datos completos del DNI.
     */
    public DniResponse.DatosDni obtenerDatosDni(String dni) {
        log.info("Consultando datos para DNI: {}", dni);
        DniResponse response = realizarPeticion(dni);

        if (response != null && response.isSuccess()) {
            return response.getDatos();
        }

        log.warn("No se encontraron datos para el DNI: {}", dni);
        return null;
    }

    /**
     * Método Privado Centralizado: Evita repetir la configuración de headers y el try-catch.
     */
    private DniResponse realizarPeticion(String dni) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(BEARER_TOKEN);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<DniResponse> response = restTemplate.exchange(
                    API_URL + dni,
                    HttpMethod.GET,
                    entity,
                    DniResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error en la conexión con ApiCloud para DNI {}: {}", dni, e.getMessage());
            return null;
        }
    }
}
