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

@CrossOrigin(origins = "*") // Allow all origins for development
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
    public ResponseEntity<BadgeResponseDTO> identify(@RequestBody ScanAlertRequestDTO request,
                                                     Authentication authentication) {
        return badgeService.identifyByFace(request, authentication.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // Endpoint para QR Code (Acceso por UUID)
    @GetMapping("/scan/qr")
    public ResponseEntity<BadgeResponseDTO> getByUuid(@RequestBody ScanAlertRequestDTO request,
                                                      Authentication authentication) {
        return ResponseEntity.ok(badgeService.getByUuid(request, authentication.getName()));
    }

}
