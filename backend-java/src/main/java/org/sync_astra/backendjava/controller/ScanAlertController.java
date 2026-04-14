package org.sync_astra.backendjava.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.sync_astra.backendjava.dtos.request.ScanAlertRequestDTO;
import org.sync_astra.backendjava.service.ScanAlertService;

@CrossOrigin(origins = "*") // Ajusta el origins al puerto frontend (localhost:5173 o 3000)
@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class ScanAlertController {

    private final ScanAlertService scanAlertService;

    @PostMapping("/scan")
    public ResponseEntity<Void> processScanAlert(@Valid @RequestBody ScanAlertRequestDTO request) {
        scanAlertService.createAlert(request);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }
}

