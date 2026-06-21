package com.perenai.biotech.repository;

import com.perenai.biotech.model.BiometricScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BiometricScanRepository extends JpaRepository<BiometricScan, Long> {

    // Retrieve scans for a user ordered by date ascending
    List<BiometricScan> findByUserIdOrderByScanDateAsc(Long userId);

    // Retrieve the latest scan for a user
    @Query("SELECT b FROM BiometricScan b WHERE b.user.id = :userId ORDER BY b.scanDate DESC LIMIT 1")
    Optional<BiometricScan> findLatestScanByUserId(@Param("userId") Long userId);
}
