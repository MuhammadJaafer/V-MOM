package com.v_mom.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "summaries")
@Data
public class Summary {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long summaryId;

  @ManyToOne(optional = false)
  @JoinColumn(name = "meeting_id")
  private Meeting meeting;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String summaryText;

  @CreationTimestamp
  private LocalDateTime createdAt;
}
