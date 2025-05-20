package com.v_mom.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "transcripts")
@Data
public class Transcript {
  @Id
  @Column(nullable = false, columnDefinition = "TEXT")
  private String transcriptId;

  @ManyToOne(optional = false)
  @JoinColumn(name = "meeting_id")
  private Meeting meeting;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @CreationTimestamp
  private LocalDateTime createdAt;
}
