package org.sync_astra.backendjava.controller;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertPart2RequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.request.VerifyQrFaceRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.dtos.response.VerifyQrFaceResponseDTO;
import org.sync_astra.backendjava.service.BadgeService;
import org.sync_astra.backendjava.service.ScanAlertService;
import org.sync_astra.backendjava.util.ValidateGroup;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/badge")
@RequiredArgsConstructor
public class BadgeController {
    private final BadgeService badgeService;
    private final ScanAlertService scanAlertService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BadgeResponseDTO> register(
            @RequestPart("data") @Validated(ValidateGroup.OnCreate.class) BadgeRequestDTO request,
            @RequestPart("file") @NotNull(message = "El archivo de la foto es obligatorio") MultipartFile file,
            Authentication authentication) {
        return new ResponseEntity<>(badgeService.createWithPhoto(request, file, authentication.getName()), HttpStatus.CREATED);
    }

    // Endpoint para Reconocimiento Facial
    @PostMapping("/scan/face")
    public ResponseEntity<UUID> identify(
            @RequestPart("data") @Validated(ValidateGroup.OnScanFace.class) ScanAlertRequestDTO request,
            @RequestPart("file") @NotNull(message = "El archivo de la foto es obligatorio") MultipartFile file
    ) {
        try {
            // El servicio retorna el UUID si es exitoso
            UUID alertId = badgeService.identifyByFace(request, file);
            return ResponseEntity.ok(alertId);

        } catch (EntityNotFoundException e) {
            // Si el servicio lanza la excepción por no pasar el umbral, devolvemos 401
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/scan/qr/verify-face")
    public ResponseEntity<?> verifyQrFace(@Valid @RequestBody VerifyQrFaceRequestDTO request) {
        try {
            VerifyQrFaceResponseDTO response = badgeService.verifyFaceForQr(request);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/scan/qr")
    public ResponseEntity<?> scanByQr(
            @RequestPart("data") @Validated(ValidateGroup.OnScanQR.class) ScanAlertRequestDTO request,
            @RequestPart("file") @NotNull(message = "El archivo de la foto es obligatorio") MultipartFile file
    ) {
        try {
            UUID alertId = badgeService.getByUuid(request, file);
            return ResponseEntity.ok(alertId);

        } catch (EntityNotFoundException e) {
            // Si el QR no existe en la base de datos, devolvemos 404
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }
    @PostMapping("/scan/{uuid}")
    public ResponseEntity<BadgeResponseDTO> alertPart2(@PathVariable UUID uuid, @RequestBody ScanAlertPart2RequestDTO request) {
        return ResponseEntity.ok(scanAlertService.processAndSendAlertPart2(uuid, request));
    }

    // Endpoint para Consultar Badge por UUID (sin alerta)
    @GetMapping("/uuid/{uuid}")
    public ResponseEntity<BadgeResponseDTO> getBadgeByUuid(@PathVariable String uuid) {
        return ResponseEntity.ok(badgeService.getBadgeByUuid(uuid));
    }

}
