package com.v_mom.service;

import jakarta.annotation.PreDestroy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.*;

@Service
public class SummaryCacheService {

  private final Map<String, String> summaries = new ConcurrentHashMap<>();
  private final Map<String, Double> progress = new ConcurrentHashMap<>();
  private final Map<String, Instant> summaryTimestamps = new ConcurrentHashMap<>();
  private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor();

  public void setProgress(String uuid, Double percent) {
    progress.put(uuid, percent);
  }

  public void incrementProgress(String uuid, double increment) {
    if(increment < 0) {
      throw new IllegalArgumentException("Increment must be non-negative");
    }
    if(!progress.containsKey(uuid)) {
      progress.put(uuid, 0.0);
    }

    progress.merge(uuid, increment, Double::sum);
  }

  public Double getProgress(String uuid) {
    return progress.get(uuid);
  }

  public void removeProgress(String uuid) {
    progress.remove(uuid);
  }

  // Store generated summary
  public void storeSummary(String uuid, String summary) {
    summaries.put(uuid, summary);
    summaryTimestamps.put(uuid, Instant.now());
  }

  public String retrieveAndRemoveSummary(String uuid) {
    summaryTimestamps.remove(uuid);
    return summaries.remove(uuid);
  }

  public boolean isSummaryReady(String uuid) {
    return summaries.containsKey(uuid);
  }

  // Periodic cleanup
  @Scheduled(fixedRate = 5 * 60 * 1000) // Every 5 minutes
  public void cleanupOldSummaries() {
    Instant now = Instant.now();
    summaryTimestamps.forEach((uuid, timestamp) -> {
      if (now.minusSeconds(30 * 60).isAfter(timestamp)) {
        summaries.remove(uuid);
        summaryTimestamps.remove(uuid);
      }
    });
  }

  @PreDestroy
  public void shutdown() {
    cleaner.shutdown();
  }
}
