package org.crime.pinpatrol.controller;

import org.crime.pinpatrol.dto.DashboardStatsResponse;
import org.crime.pinpatrol.model.Report;
import org.crime.pinpatrol.repository.ReportRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ReportRepository reportRepository;

    public DashboardController(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long open = reportRepository.countByStatus(Report.Status.OPEN);
        long investigating = reportRepository.countByStatus(Report.Status.IN_PROGRESS);
        long resolved = reportRepository.countByStatus(Report.Status.RESOLVED);
        long highSeverity = reportRepository.countBySeverity(Report.Severity.HIGH);

        // No GROUP BY support in derived queries — fetch and group in Java instead.
        List<Report> allReports = reportRepository.findAll();
        Map<String, Long> byCategory = allReports.stream()
                .collect(Collectors.groupingBy(Report::getCategory, Collectors.counting()));

        return new DashboardStatsResponse(open, investigating, resolved, highSeverity, byCategory);
    }
}
