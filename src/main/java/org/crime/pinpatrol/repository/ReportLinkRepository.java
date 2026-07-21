package org.crime.pinpatrol.repository;

import org.crime.pinpatrol.model.Report;
import org.crime.pinpatrol.model.ReportLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportLinkRepository extends JpaRepository<ReportLink, Long> {

    List<ReportLink> findAllByReport_Id(Long reportId);

    List<ReportLink> findAllByReport_IdOrRelatedReport_Id(Long reportId, Long relatedReportId);

    boolean existsByReportAndRelatedReport(
            Report report,
            Report relatedReport
    );

    boolean existsByReportAndRelatedReportAndLinkType(
            Report report,
            Report relatedReport,
            ReportLink.LinkType linkType
    );
}