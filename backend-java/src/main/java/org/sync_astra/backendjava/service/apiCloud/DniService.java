package org.sync_astra.backendjava.service.apiCloud;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class DniService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${mi-api-cloud.url}")
    private String API_URL;

    @Value("${mi-api-cloud.token}")
    private String BEARER_TOKEN;

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

        if (response != null && response.isSuccess() && response.getDatos() != null) {
            return response.getDatos();
        }

        log.warn("No se encontraron datos útiles para el DNI: {}", dni);
        return null;
    }

    /**
     * Método Privado Centralizado con manejo de excepciones granular.
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

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            // CASO 1: La API respondió, pero con un error (401 Token Expirado, 404 No encontrado, 500 Error de su servidor, etc.)
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                // AQUI: Registramos explícitamente que el DNI no fue encontrado
                log.warn("El DNI {} no existe en los registros de ApiCloud (HTTP 404).", dni);
                return null;
            }

            // Para otros errores HTTP (401, 500, etc.) lo registramos como error y lanzamos la excepción
            log.error("ApiCloud rechazó la petición para el DNI {}. HTTP Status: {}. Respuesta: {}",
                    dni, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Error al consultar ApiCloud (Posible Token expirado o fallo de su API): " + e.getStatusCode());

        } catch (ResourceAccessException e) {
            // CASO 2: Error de red, URL mal escrita, timeout, no hay DNS. No se pudo llegar a la API.
            log.error("Error de conectividad con ApiCloud. Verifica la URL, la red o si el servicio está caído. Detalle: {}", e.getMessage());
            throw new RuntimeException("Error de conexión con el servicio externo de DNI.");

        } catch (Exception e) {
            // CASO 3: Cualquier otro error inesperado interno (ej. fallo al parsear el JSON de respuesta)
            log.error("Error inesperado procesando la respuesta de ApiCloud para DNI {}: {}", dni, e.getMessage());
            throw new RuntimeException("Error interno procesando el DNI.");
        }
    }
}