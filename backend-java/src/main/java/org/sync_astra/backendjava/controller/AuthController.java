package org.sync_astra.backendjava.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.sync_astra.backendjava.dtos.request.RefreshTokenRequestDTO;
import org.sync_astra.backendjava.dtos.request.UserRequestDTO;
import org.sync_astra.backendjava.dtos.response.AuthResponseDTO;
import org.sync_astra.backendjava.service.auth.AuthService;

@CrossOrigin(origins = "*") // Allow all origins for development
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * 1. REGISTRO
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody UserRequestDTO request) {
        log.info("Petición REST para registrar usuario: {}", request.getDni());
        AuthResponseDTO response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 2. LOGIN
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody UserRequestDTO request) {
        log.info("Petición REST para login de usuario: {}", request.getDni());
        AuthResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. REFRESH TOKEN
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refreshToken(@RequestBody RefreshTokenRequestDTO request) {
        log.info("Petición REST para refrescar token");
        AuthResponseDTO response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. LOGOUT
     * POST /api/auth/logout
     * Requiere que el usuario envíe su Access Token actual (Bearer token).
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(Authentication authentication) {
        // Extraemos el nombre de usuario del token JWT autenticado en este momento
        String userName = authentication.getName();

        log.info("Petición REST para logout de usuario: {}", userName);
        authService.logout(userName);

        return ResponseEntity.ok("Sesión cerrada exitosamente");
    }
}
