package org.sync_astra.backendjava.service.auth;


import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.sync_astra.backendjava.dtos.request.RefreshTokenRequestDTO;
import org.sync_astra.backendjava.dtos.request.UserRequestDTO;
import org.sync_astra.backendjava.dtos.response.AuthResponseDTO;
import org.sync_astra.backendjava.jwt.JwtUtil;
import org.sync_astra.backendjava.mapper.mapperImpl.UserMapper;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.service.apiCloud.DniService;
import org.sync_astra.backendjava.service.email.EmailOrchestratorService;
import org.sync_astra.backendjava.service.email.ResendEmailService;

import java.util.Collections;


@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final org.sync_astra.backendjava.repository.UserRepository userRepository;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RedisAuthService redisAuthService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final UserDetailsService userDetailsService;
    private final EmailOrchestratorService emailOrchestratorService;
    private final DniService dniService;

    /**
     * 1. REGISTRO + AUTO-LOGIN
     * Registra al usuario y devuelve directamente los tokens de sesión.
     */
    @Transactional
    public AuthResponseDTO register(UserRequestDTO dto) {
        log.info("Registrando nuevo usuario: {}", dto.getDni());

        // Validamos que las contraseñas coincidan antes de tocar la base de datos
        if (!dto.getPasswordHash().equals(dto.getConfirmPasswordHash())) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }

        // Usamos la abstracción de MapStruct (Convert) para crear el modelo desde el DTO
        if(!dniService.existeDni(dto.getDni())){
            throw new RuntimeException("El DNI proporcionado no es valido o no existe en la base de datos oficial.");
        }



        Users model = userMapper.toModel(dto);
        model.setPasswordHash(passwordEncoder.encode(dto.getPasswordHash()));

        // Guardamos en BD
        Users savedUser = userRepository.save(model);

        // AUTO-LOGIN: Construimos el MainUser y forzamos la autenticación
        MainUser mainUser = MainUser.build(savedUser, Collections.emptyList());
        Authentication auth = new UsernamePasswordAuthenticationToken(
                mainUser, null, mainUser.getAuthorities()
        );

        String htmlContent = """
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a TE ENCONTRÉ</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7f6; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                            <tr>
                                <td align="center" style="background-color: #2b6cb0; padding: 30px 20px;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">TE ENCONTRÉ</h1>
                                </td>
                            </tr>
        
                            <tr>
                                <td style="padding: 40px 30px; color: #333333;">
                                    <h2 style="margin-top: 0; color: #2d3748; font-size: 24px;">¡Registro exitoso!</h2>
                                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                        Hola, nos alegra confirmarte que tu cuenta ha sido creada correctamente. ¡Bienvenido a nuestra comunidad!
                                    </p>
                                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                        Con <strong>TE ENCONTRÉ</strong>, ahora cuentas con la herramienta ideal para mantener a tus seres queridos seguros. A partir de este momento, podrás generar credenciales de identificación (badges), registrar información médica vital y asignar contactos de emergencia directamente desde tu panel de control.
                                    </p>
                                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                                        Estamos aquí para apoyarte. Si tienes alguna duda o necesitas asistencia durante el uso de la plataforma, nuestro equipo de soporte estará a tu disposición.
                                    </p>
                                </td>
                            </tr>
        
                            <tr>
                                <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 13px; color: #718096; margin: 0;">
                                        © 2026 Plataforma TE ENCONTRÉ | Seguridad y Protección.
                                    </p>
                                    <p style="font-size: 13px; color: #718096; margin: 5px 0 0 0;">
                                        Estás recibiendo este mensaje informativo como confirmación de tu registro en el sistema.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """;

        emailOrchestratorService.sendManageEmail("USERS",savedUser.getUuid(),savedUser.getEmail(), "Bienvenido a TE ENCONTRÉ", htmlContent);

        // Generamos y devolvemos los tokens
        return generateAndSaveTokens(auth, mainUser.getUsername());
    }

    /**
     * 2. LOGIN ESTÁNDAR
     * Valida credenciales y devuelve los tokens. Se ignora el campo confirmPasswordHash.
     */
    public AuthResponseDTO login(UserRequestDTO request) {
        log.info("Intento de login para: {}", request.getDni());

        // Validar credenciales contra la BD (Spring Security maneja esto con el UserDetailsService)
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getDni(), request.getPasswordHash())
        );

        MainUser mainUser = (MainUser) auth.getPrincipal();

        // Generamos y devolvemos los tokens
        assert mainUser != null;

        String htmlContent = """
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nuevo inicio de sesión - TE ENCONTRÉ</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7f6; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                            <tr>
                                <td align="center" style="background-color: #1a365d; padding: 30px 20px;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">TE ENCONTRÉ</h1>
                                </td>
                            </tr>
        
                            <tr>
                                <td style="padding: 40px 30px; color: #333333;">
                                    <h2 style="margin-top: 0; color: #2d3748; font-size: 24px;">Alerta de seguridad</h2>
                                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                        Hola, te informamos que se ha registrado un nuevo acceso a tu cuenta de <strong>TE ENCONTRÉ</strong>.
                                    </p>
        
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-left: 4px solid #2b6cb0; margin-bottom: 25px; border-radius: 4px;">
                                        <tr>
                                            <td style="padding: 15px;">
                                                <p style="margin: 0; font-size: 14px; color: #4a5568; line-height: 1.5;">
                                                    <strong>Detalles del acceso:</strong><br>
                                                    Fecha y hora: {{fecha_hora}}<br>
                                                    Dispositivo: {{dispositivo}}
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
        
                                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                        <strong>¿Fuiste tú?</strong><br>
                                        Si es así, puedes ignorar este mensaje y continuar navegando con tranquilidad.
                                    </p>
        
                                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0; color: #c53030;">
                                        <strong>¿No reconoces esta actividad?</strong><br>
                                        Si no iniciaste sesión recientemente, te recomendamos ingresar a la plataforma y actualizar tu contraseña lo antes posible para mantener tu información segura.
                                    </p>
                                </td>
                            </tr>
        
                            <tr>
                                <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 13px; color: #718096; margin: 0;">
                                        © 2026 Plataforma TE ENCONTRÉ | Seguridad y Protección.
                                    </p>
                                    <p style="font-size: 13px; color: #718096; margin: 5px 0 0 0;">
                                        Este es un mensaje de seguridad automático. Por favor, no respondas a este correo.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """.replace("{{fecha_hora}}", java.time.LocalDateTime.now().toString())
                .replace("{{dispositivo}}", "Navegador Web (detalles no disponibles)"); // Aquí podrías integrar una librería para detectar el user agent real
        emailOrchestratorService.sendManageEmail("USERS",mainUser.getUuid(),mainUser.getEmail(), "Nuevo inicio de sesión en tu cuenta de TE ENCONTRÉ", htmlContent);
        return generateAndSaveTokens(auth, mainUser.getUsername());
    }

    /**
     * 3. LOGOUT (EL ANIQUILADOR)
     * Invalida la sesión actual eliminando los tokens de Redis.
     */
    public void logout(String userName) {
        log.info("Cerrando sesión para: {}", userName);
        redisAuthService.deleteAllUserSessions(userName);
    }

    /**
     * 4. REFRESH TOKEN
     * Renueva el Access Token validando que la sesión siga viva en Redis.
     */
    public AuthResponseDTO refreshToken(RefreshTokenRequestDTO request) {
        String refreshToken = request.getRefreshToken();

        // 1. Validar firma y expiración básica del Refresh Token
        if (!jwtUtil.isTokenValid(refreshToken)) {
            throw new JwtException("El Refresh Token ha expirado o es inválido.");
        }

        // Extraemos el userName (que configuramos como el subject en JwtUtil)
        String userName = jwtUtil.extractUsername(refreshToken);

        // 2. VALIDACIÓN CRÍTICA CONTRA REDIS (El Aniquilador)
        String savedRefreshToken = redisAuthService.getRefreshToken(userName);

        if (savedRefreshToken == null || !savedRefreshToken.equals(refreshToken)) {
            log.warn(">>> Intento de refresh con token aniquilado o inexistente para: {}", userName);
            throw new RuntimeException("La sesión ha expirado o ha sido cerrada. Inicie sesión de nuevo.");
        }

        // 3. Generamos el nuevo Access Token con datos frescos de la BD
        MainUser mainUser = (MainUser) userDetailsService.loadUserByUsername(userName);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                mainUser, null, mainUser.getAuthorities()
        );

        String newAccessToken = jwtUtil.generateToken(auth);

        // 4. Actualizamos SOLO el Access Token en Redis (El Refresh se mantiene igual hasta que expire)
        redisAuthService.saveTokenInRedis(
                userName,
                newAccessToken,
                jwtUtil.getExpirationTime(newAccessToken),
                false
        );

        // Devolvemos el nuevo par de tokens
        return new AuthResponseDTO(newAccessToken, refreshToken);
    }

    /**
     * Método auxiliar privado para no repetir la lógica de generación y guardado en Redis
     */
    private AuthResponseDTO generateAndSaveTokens(Authentication auth, String userName) {
        String accessToken = jwtUtil.generateToken(auth);
        String refreshToken = jwtUtil.generateRefreshToken(auth);

        // Guardamos Access Token
        redisAuthService.saveTokenInRedis(
                userName,
                accessToken,
                jwtUtil.getExpirationTime(accessToken),
                false
        );

        // Guardamos Refresh Token
        redisAuthService.saveTokenInRedis(
                userName,
                refreshToken,
                jwtUtil.getExpirationTime(refreshToken),
                true
        );

        return new AuthResponseDTO(accessToken, refreshToken);
    }
}