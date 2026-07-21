package org.crime.pinpatrol.controller;

import jakarta.validation.Valid;
import org.crime.pinpatrol.dto.CreateReportRequest;
import org.crime.pinpatrol.dto.ReportResponse;
import org.crime.pinpatrol.dto.UpdateStatusRequest;
import org.crime.pinpatrol.dto.VerifyReportRequest;
import org.crime.pinpatrol.model.Report;
import org.crime.pinpatrol.model.ReportLink;
import org.crime.pinpatrol.model.ReportMedia;
import org.crime.pinpatrol.repository.ReportLinkRepository;
import org.crime.pinpatrol.repository.ReportMediaRepository;
import org.crime.pinpatrol.repository.ReportRepository;
import org.crime.pinpatrol.repository.UserRepository;
import org.crime.pinpatrol.security.JwtAuthFilter.AuthenticatedUser;
import org.crime.pinpatrol.service.ReportInsightService;
import org.crime.pinpatrol.util.GeoUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportMediaRepository reportMediaRepository;


    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ReportLinkRepository reportLinkRepository;
    private final ReportInsightService reportInsightService;

    public ReportController(
            ReportRepository reportRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            ReportLinkRepository reportLinkRepository,
            ReportInsightService reportInsightService,
            ReportMediaRepository reportMediaRepository
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.reportLinkRepository = reportLinkRepository;
        this.reportInsightService = reportInsightService;
        this.reportMediaRepository = reportMediaRepository;
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
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Report not found"));
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


        List<Report> candidates = reportRepository.findAll()
                .stream()
                .filter(r -> !r.getId().equals(saved.getId()))
                .filter(r -> r.getCategory() == saved.getCategory())
                .toList();


        for (Report candidate : candidates) {
            double distance = GeoUtils.distanceMeters(saved.getLat(), saved.getLng(), candidate.getLat(), candidate.getLng());
            if (distance <= 150) {
                ReportLink link = ReportLink.builder()
                        .report(saved)
                        .relatedReport(candidate)
                        .linkType(ReportLink.LinkType.DUPLICATE)
                        .aiReason(String.format(
                                "Auto-flagged: same category (%s) within %.0fm and 60 minutes",
                                saved.getCategory(), distance))
                        .build();
                reportLinkRepository.save(link);
            }
        }

        List<ReportInsightService.SimilarMatch> similarMatches =
                reportInsightService.findSimilar(saved, candidates);


        Map<Long, Report> candidateMap = candidates.stream()
                .collect(Collectors.toMap(
                        Report::getId,
                        Function.identity()
                ));

        for (ReportInsightService.SimilarMatch match : similarMatches) {

            Report candidate = candidateMap.get(match.id());

            if (candidate == null)
                continue;

            boolean alreadyExists =
                    reportLinkRepository.existsByReportAndRelatedReportAndLinkType(
                            saved,
                            candidate,
                            ReportLink.LinkType.SIMILAR
                    );

            if (alreadyExists)
                continue;

            ReportLink link = ReportLink.builder()
                    .report(saved)
                    .relatedReport(candidate)
                    .linkType(ReportLink.LinkType.SIMILAR)
                    .aiReason(match.reason())
                    .build();

            reportLinkRepository.save(link);
        }

        ReportResponse response = ReportResponse.from(saved);
        messagingTemplate.convertAndSend("/topic/reports", response);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/verify")
    @Transactional
    public ResponseEntity<?> verifyReport(
            @PathVariable Long id,
            @Valid @RequestBody VerifyReportRequest req,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        if (req.verificationStatus() == Report.VerificationStatus.PENDING) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Cannot set verification status back to PENDING"));
        }

        Report report = reportRepository.findById(id).orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Report not found"));
        }

        report.setVerificationStatus(req.verificationStatus());
        report.setVerifiedBy(userRepository.getReferenceById(principal.userId()));
        report.setVerifiedAt(LocalDateTime.now());

        Report saved = reportRepository.save(report);
        return ResponseEntity.ok(ReportResponse.from(saved));
    }

    @GetMapping("/{id}/summary")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getCaseSummary(@PathVariable Long id) {

        Report report = reportRepository.findById(id).orElse(null);

        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Report not found"));
        }

        List<ReportMedia> media =
                reportMediaRepository.findAllByReport_Id(id);

        List<ReportLink> links =
                reportLinkRepository.findAllByReport_IdOrRelatedReport_Id(id, id);

        String summary =
                reportInsightService.summarizeCase(report, media, links);

        report.setAiCaseBrief(summary);
        reportRepository.save(report);

        return ResponseEntity.ok(Map.of(
                "reportId", report.getId(),
                "summary", summary
        ));
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest req
    ) {
        Report report = reportRepository.findById(id).orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Report not found"));
        }

        report.setStatus(req.status());
        Report saved = reportRepository.save(report);
        return ResponseEntity.ok(ReportResponse.from(saved));
    }

    public record ErrorResponse(String message) {}
}