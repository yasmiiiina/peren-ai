package com.perenai.biotech.controller;

import com.perenai.biotech.dto.BiometricScanResponseDto;
import com.perenai.biotech.model.BiometricScan;
import com.perenai.biotech.repository.BiometricScanRepository;
import com.perenai.biotech.service.PhysiologicalConversionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/biometric-scan")
@CrossOrigin(origins = "*")
public class BiometricScanController {

    @Autowired
    private BiometricScanRepository scanRepository;

    @Autowired
    private PhysiologicalConversionService physiologicalService;

    /**
     * Get the latest processed biometric scan for a user.
     */
    @GetMapping("/latest/{userId}")
    public ResponseEntity<BiometricScanResponseDto> getLatestScan(@PathVariable Long userId) {
        return scanRepository.findLatestScanByUserId(userId)
                .map(scan -> ResponseEntity.ok(physiologicalService.processScan(scan)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get the scan history for a user (useful for drawing chronological progress trends).
     */
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<BiometricScanResponseDto>> getScanHistory(@PathVariable Long userId) {
        List<BiometricScan> scans = scanRepository.findByUserIdOrderByScanDateAsc(userId);
        if (scans.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        List<BiometricScanResponseDto> history = scans.stream()
                .map(physiologicalService::processScan)
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }
}
