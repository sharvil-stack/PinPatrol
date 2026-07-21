package org.crime.pinpatrol.repository;
import org.crime.pinpatrol.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;
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


}
