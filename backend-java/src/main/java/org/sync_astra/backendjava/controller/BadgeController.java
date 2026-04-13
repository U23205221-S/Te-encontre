package org.sync_astra.backendjava.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.sync_astra.backendjava.dtos.request.BadgeRequestDTO;
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
            @RequestPart("file") MultipartFile file) {
        return new ResponseEntity<>(badgeService.createWithPhoto(request, file), HttpStatus.CREATED);
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
