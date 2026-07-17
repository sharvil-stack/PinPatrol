package org.crime.pinpatrol.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "report_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@ToString(exclude = "report")
public class ReportMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @Column(nullable = false, length = 500)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaType type;

    @Column(name = "ai_description", columnDefinition = "TEXT")
    private String aiDescription;

    public enum MediaType {
        IMAGE,
        VIDEO,
        AUDIO
    }
}
