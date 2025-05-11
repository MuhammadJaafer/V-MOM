package com.v_mom.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.v_mom.entity.Meeting;
import com.v_mom.entity.Summary;
import com.v_mom.repository.SummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SummaryService {

  private final SummaryRepository summaryRepository;
  private final ObjectMapper objectMapper;

  @Autowired
  public SummaryService(SummaryRepository summaryRepository, ObjectMapper objectMapper) {
    this.summaryRepository = summaryRepository;
    this.objectMapper = objectMapper;
  }

  public void saveSummary(Meeting meeting, String rawResponse) {
    try {
      String cleaned = rawResponse
          .replaceAll("(?s)^```json\\s*", "")
          .replaceAll("(?s)^```\\s*", "")
          .replaceAll("(?s)\\s*```$", "")
          .trim();

      JsonNode jsonNode = objectMapper.readTree(cleaned);

      Summary summary = new Summary();
      summary.setMeeting(meeting);
      summary.setMoM(jsonNode);

      summaryRepository.save(summary);
    } catch (Exception e) {
      throw new RuntimeException("Failed to parse and save summary", e);
    }
  }
}