package org.crime.pinpatrol.repository;
import org.crime.pinpatrol.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findAllByVerificationStatusOrderByCreatedAtDesc(Report.VerificationStatus verificationStatus);

    List<Report> findAllByStatusOrderByCreatedAtDesc(Report.Status status);
}
