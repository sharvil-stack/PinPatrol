package org.crime.pinpatrol.controller;

import com.cloudinary.Cloudinary;
import jakarta.validation.Valid;
import org.crime.pinpatrol.dto.AddMediaRequest;
import org.crime.pinpatrol.dto.MediaResponse;
import org.crime.pinpatrol.dto.SignatureResponse;
import org.crime.pinpatrol.model.Report;
import org.crime.pinpatrol.model.ReportMedia;
import org.crime.pinpatrol.repository.ReportMediaRepository;
import org.crime.pinpatrol.repository.ReportRepository;
import org.crime.pinpatrol.security.JwtAuthFilter.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.crime.pinpatrol.service.VisionService;

import java.util.Map;
import java.util.TreeMap;



@RestController
@RequestMapping("/api")
public class MediaController {

    private final Cloudinary cloudinary;
    private final ReportRepository reportRepository;
    private final ReportMediaRepository reportMediaRepository;


    @GetMapping("/media/signature")
    public ResponseEntity<?> getSignature(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Sign in required"));
        }

        long timestamp = System.currentTimeMillis() / 1000L;
        String folder = "pinpatrol/reports";

        Map<String, Object> paramsToSign = new TreeMap<>();
        paramsToSign.put("timestamp", timestamp);
        paramsToSign.put("folder", folder);

        String signature = cloudinary.apiSignRequest(paramsToSign, cloudinary.config.apiSecret);

        return ResponseEntity.ok(new SignatureResponse(
                timestamp, signature, cloudinary.config.apiKey, cloudinary.config.cloudName, folder
        ));
    }

    @PostMapping("/reports/{id}/media")
    @Transactional
    public ResponseEntity<?> attachMedia(
            @PathVariable Long id,
            @Valid @RequestBody AddMediaRequest req,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Sign in required"));
        }

        Report report = reportRepository.findById(id).orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Report not found"));
        }

        boolean isOwner = report.getReporter() != null && report.getReporter().getId().equals(principal.userId());
        boolean isOfficer = "OFFICER".equals(principal.role());
        if (!isOwner && !isOfficer) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("You can only attach media to your own reports"));
        }

        String expectedHost = "res.cloudinary.com/" + cloudinary.config.cloudName + "/";
        if (!req.url().contains(expectedHost)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid media URL"));
        }

        ReportMedia media = ReportMedia.builder()
                .report(reportRepository.getReferenceById(id))
                .url(req.url())
                .type(req.type())
                .build();

        ReportMedia saved = reportMediaRepository.save(media);
        return ResponseEntity.status(HttpStatus.CREATED).body(MediaResponse.from(saved));
    }

    @PostMapping("/reports/{reportId}/media/{mediaId}/describe")
    @Transactional
    public ResponseEntity<?> describeMedia(
            @PathVariable Long reportId,
            @PathVariable Long mediaId,
            @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Sign in required"));
        }

        ReportMedia media = reportMediaRepository.findById(mediaId).orElse(null);
        if (media == null || !media.getReport().getId().equals(reportId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Media not found"));
        }

        boolean isOwner = media.getReport().getReporter() != null
                && media.getReport().getReporter().getId().equals(principal.userId());
        boolean isOfficer = "OFFICER".equals(principal.role());
        if (!isOwner && !isOfficer) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Not authorized"));
        }

        if (media.getType() != ReportMedia.MediaType.IMAGE) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("AI description currently only supports images"));
        }

        String description = visionService.describeImage(media.getUrl());
        media.setAiDescription(description);
        ReportMedia saved = reportMediaRepository.save(media);

        return ResponseEntity.ok(MediaResponse.from(saved));
    }

    private final VisionService visionService;

    public MediaController(Cloudinary cloudinary, ReportRepository reportRepository,
                           ReportMediaRepository reportMediaRepository, VisionService visionService) {
        this.cloudinary = cloudinary;
        this.reportRepository = reportRepository;
        this.reportMediaRepository = reportMediaRepository;
        this.visionService = visionService;
    }

    public record ErrorResponse(String message) {}
}
