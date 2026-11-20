package org.sync_astra.backendjava.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.sync_astra.backendjava.dtos.response.GuardianAlertDTO;
import org.sync_astra.backendjava.dtos.response.PublicAssistanceDTO;
import org.sync_astra.backendjava.service.ScanAlertService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final ScanAlertService scanAlertService;

    @GetMapping("/public/{alertUuid}/status")
    public ResponseEntity<PublicAssistanceDTO> getPublicAlertStatus(@PathVariable UUID alertUuid) {
        return ResponseEntity.ok(scanAlertService.getPublicAlertStatus(alertUuid));
    }

    @PostMapping("/public/{alertUuid}/confirm")
    public ResponseEntity<GuardianAlertDTO> confirmByToken(
            @PathVariable UUID alertUuid,
            @RequestParam("token") UUID confirmationToken) {
        return ResponseEntity.ok(scanAlertService.confirmAlert(alertUuid, confirmationToken, null));
    }

    @GetMapping("/my")
    public ResponseEntity<List<GuardianAlertDTO>> getMyAlerts(Authentication authentication) {
        return ResponseEntity.ok(scanAlertService.getMyAlerts(authentication.getName()));
    }

    @PostMapping("/{alertUuid}/confirm")
    public ResponseEntity<GuardianAlertDTO> confirmAuthenticated(
            @PathVariable UUID alertUuid,
            @RequestParam(value = "token", required = false) UUID confirmationToken,
            Authentication authentication) {
        return ResponseEntity.ok(scanAlertService.confirmAlert(alertUuid, confirmationToken, authentication.getName()));
    }
}
