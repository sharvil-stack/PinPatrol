package org.crime.pinpatrol.repository;

import org.crime.pinpatrol.model.ReportLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportLinkRepository extends JpaRepository<ReportLink, Long> {

    List<ReportLink> findAllByReport_Id(Long reportId);
}