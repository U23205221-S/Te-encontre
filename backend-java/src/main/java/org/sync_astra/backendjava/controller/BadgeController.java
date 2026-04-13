package org.sync_astra.backendjava.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
import org.sync_astra.backendjava.dtos.response.BadgeResponseDTO;
import org.sync_astra.backendjava.service.BadgeService;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/badge")
@RequiredArgsConstructor
public class BadgeController {
    private final BadgeService badgeService;

    // 1. Registro de nuevo Badge
    @PostMapping
    public ResponseEntity<BadgeResponseDTO> register(@RequestBody BadgeRequestDTO request) {
        return new ResponseEntity<>(badgeService.create(request), HttpStatus.CREATED);
    }

    // Endpoint para Reconocimiento Facial
    @PostMapping("/identify")
    public ResponseEntity<BadgeResponseDTO> identify(@RequestBody float[] faceVector) {
        return badgeService.identifyByFace(faceVector)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // Endpoint para QR Code (Acceso por UUID)
    @GetMapping("/uuid/{uuid}")
    public ResponseEntity<BadgeResponseDTO> getByUuid(@PathVariable UUID uuid) {
        return ResponseEntity.ok(badgeService.getByUuid(uuid));
    }
}
