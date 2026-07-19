package org.crime.pinpatrol.controller;

import jakarta.validation.Valid;
import org.crime.pinpatrol.dto.CreateReportRequest;
import org.crime.pinpatrol.dto.ReportResponse;
import org.crime.pinpatrol.model.Report;
import org.crime.pinpatrol.repository.ReportRepository;
import org.crime.pinpatrol.repository.UserRepository;
import org.crime.pinpatrol.security.JwtAuthFilter.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ReportController(ReportRepository reportRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }


    @GetMapping
    @Transactional(readOnly = true)
    public List<ReportResponse> listReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ReportResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getReport(@PathVariable Long id) {
        Report report = reportRepository.findById(id).orElse(null);

        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Report not found"));
        }

        return ResponseEntity.ok(ReportResponse.from(report));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createReport(
            @Valid @RequestBody CreateReportRequest req,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Sign in to submit a report"));
        }

        var reporter = userRepository.getReferenceById(principal.userId());

        Report report = Report.builder()
                .lat(req.lat())
                .lng(req.lng())
                .category(req.category())
                .severity(req.severity())
                .description(req.description())
                .status(Report.Status.OPEN)
                .verificationStatus(Report.VerificationStatus.PENDING)
                .reporter(reporter)
                .build();

        Report saved = reportRepository.save(report);

        ReportResponse response = ReportResponse.from(saved);
        messagingTemplate.convertAndSend("/topic/reports", response);
        return ResponseEntity.status(HttpStatus.CREATED).body(ReportResponse.from(saved));
    }

    public record ErrorResponse(String message) {}
}