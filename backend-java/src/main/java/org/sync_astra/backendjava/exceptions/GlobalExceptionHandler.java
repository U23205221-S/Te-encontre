package org.sync_astra.backendjava.exceptions;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.AccessDeniedException;
//import org.springframework.security.authentication.BadCredentialsException;
//import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Captura errores de validación (@NotBlank, @Null, @Min, etc.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> body = createBaseBody(HttpStatus.BAD_REQUEST, "Error de validación en los campos");

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        body.put("errors", fieldErrors);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // 2. Captura errores de negocio (Como el de las contraseñas que no coinciden)
    // Nota: Si usas una excepción personalizada como PasswordMismatchException, cámbiala aquí
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex, HttpServletRequest request) {
        Map<String, Object> body = createBaseBody(HttpStatus.BAD_REQUEST, ex.getMessage());
        body.put("path", request.getRequestURI());
        body.put("type", ex.getClass().getSimpleName());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // 3. EL ATRAPALOTODO (NullPointerException, errores de SQL, etc.)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobal(Exception ex, HttpServletRequest request) {
        Map<String, Object> body = createBaseBody(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor");

        // Esto es lo que necesitas para Postman: ver el detalle técnico
        body.put("message", ex.getMessage());
        body.put("exception", ex.getClass().getSimpleName());
        body.put("path", request.getRequestURI());

        // Opcional: ver en qué línea de código falló exactamente
        if (ex.getStackTrace().length > 0) {
            body.put("trace", ex.getStackTrace()[0].toString());
        }

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        Map<String, Object> body = createBaseBody(HttpStatus.CONFLICT, "Conflicto de datos");
        String detailedMessage = ex.getMostSpecificCause().getMessage();

        // 1. Extraemos el nombre del campo que falló (Regex para Postgres)
        String fieldName = "dato";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Key \\((.*?)\\)=");
        java.util.regex.Matcher matcher = pattern.matcher(detailedMessage);

        if (matcher.find()) {
            fieldName = matcher.group(1);
        }

        // 2. DICCIONARIO DE TRADUCCIÓN: Aquí personalizas el mensaje para el Frontend
        String finalMessage = getString(fieldName);

        body.put("message", finalMessage);
        body.put("field", fieldName); // Para que el frontend sepa exactamente qué input marcar en rojo
        body.put("path", request.getRequestURI());

        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }

    private static String getString(String fieldName) {
        Map<String, String> friendlyMessages = Map.of(
                "user_name", "El nombre de usuario ya está siendo usado por otra persona.",
                "email", "Este correo electrónico ya tiene una cuenta activa.",
                "phone_number", "El número de teléfono ya está registrado en nuestro sistema."
        );

        // 3. Buscamos la traducción o usamos un mensaje genérico
        return friendlyMessages.getOrDefault(fieldName, "Ya existe un registro con este " + fieldName + ".");
    }

    // Método privado para no repetir código en la estructura del JSON
    private Map<String, Object> createBaseBody(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }
/*
    // 4. Captura errores de Login (Credenciales incorrectas)
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        Map<String, Object> body = createBaseBody(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos.");
        body.put("path", request.getRequestURI());
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }
*/
    /*
    // 5. Captura cuando el usuario no existe (Lanzado por tu UserDetailsServiceImpl)
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUsernameNotFound(UsernameNotFoundException ex, HttpServletRequest request) {
        Map<String, Object> body = createBaseBody(HttpStatus.NOT_FOUND, ex.getMessage());
        body.put("path", request.getRequestURI());
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    // 6. Captura errores de Permisos (Ej. un ROLE_USER intenta acceder a algo de ROLE_ADMIN)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        Map<String, Object> body = createBaseBody(HttpStatus.FORBIDDEN, "No tienes permisos para acceder a este recurso.");
        body.put("path", request.getRequestURI());
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }
    // Pon esto dentro de tu GlobalExceptionHandler
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("error", "Unauthorized");
        // ¡AQUÍ ESTÁ LA MAGIA! Esto mostrará "El código de verificación es incorrecto..."
        body.put("message", ex.getMessage());
        body.put("path", request.getRequestURI());

        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }
     */
}
