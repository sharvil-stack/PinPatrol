package org.crime.pinpatrol.repository;
import org.crime.pinpatrol.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findAllByIdNot(Long id, Pageable pageable);

    List<Report> findAllByVerificationStatusOrderByCreatedAtDesc(Report.VerificationStatus verificationStatus);

    List<Report> findAllByStatusOrderByCreatedAtDesc(Report.Status status);

    long countByStatus(Report.Status status);

    long countByVerificationStatus(Report.VerificationStatus verificationStatus);

    long countBySeverity(Report.Severity severity);

    List<Report> findAllByCategoryAndIdNotAndCreatedAtGreaterThanEqual(
            String category, Long id, LocalDateTime createdAt
    );
    @Query(value = """
            SELECT * FROM reports r
            WHERE ST_Distance_Sphere(r.location, ST_SRID(POINT(:lng, :lat), 4326)) <= :radiusMeters
            ORDER BY ST_Distance_Sphere(r.location, ST_SRID(POINT(:lng, :lat), 4326)) ASC
            """, nativeQuery = true)
    List<Report> findNearby(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMeters") double radiusMeters
    );


}
