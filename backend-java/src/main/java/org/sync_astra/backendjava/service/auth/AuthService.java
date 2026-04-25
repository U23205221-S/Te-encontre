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
        Users model = userMapper.toModel(dto);
        model.setPasswordHash(passwordEncoder.encode(dto.getPasswordHash()));

        // Guardamos en BD
        Users savedUser = userRepository.save(model);

        // AUTO-LOGIN: Construimos el MainUser y forzamos la autenticación
        MainUser mainUser = MainUser.build(savedUser, Collections.emptyList());
        Authentication auth = new UsernamePasswordAuthenticationToken(
                mainUser, null, mainUser.getAuthorities()
        );

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