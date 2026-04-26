package org.sync_astra.backendjava.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.service.BadgeService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/badge")
@RequiredArgsConstructor
public class BadgeController {
    private final BadgeService badgeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BadgeResponseDTO> register(
            @RequestPart("data") BadgeRequestDTO request,
            @RequestPart("file") MultipartFile file,
            Authentication authentication) {
        return new ResponseEntity<>(badgeService.createWithPhoto(request, file, authentication.getName()), HttpStatus.CREATED);
    }

    // Endpoint para Reconocimiento Facial
    @PostMapping("/scan/face")
    public ResponseEntity<BadgeResponseDTO> identify(
            @RequestPart("data") ScanAlertRequestDTO request,
            @RequestPart("file") MultipartFile file
    ) {
        return badgeService.identifyByFace(request, file)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // Endpoint para Escaneo QR (Auditoría + Alerta)
    @PostMapping("/scan/qr")
    public ResponseEntity<BadgeResponseDTO> getByUuid(
            @RequestPart("data") ScanAlertRequestDTO request,
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.ok(badgeService.getByUuid(request,file));
    }

    // Endpoint para Consultar Badge por UUID (sin alerta)
    @GetMapping("/uuid/{uuid}")
    public ResponseEntity<BadgeResponseDTO> getBadgeByUuid(@PathVariable String uuid) {
        return ResponseEntity.ok(badgeService.getBadgeByUuid(uuid));
    }

}
