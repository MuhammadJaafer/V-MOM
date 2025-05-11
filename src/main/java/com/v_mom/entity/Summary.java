package com.v_mom.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.v_mom.util.JsonNodeConverter;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

  @Column(nullable = false, columnDefinition = "json")
  @Convert(converter = JsonNodeConverter.class)
  @JdbcTypeCode(SqlTypes.JSON)
  private JsonNode MoM;

  @CreationTimestamp
  private LocalDateTime createdAt;
}