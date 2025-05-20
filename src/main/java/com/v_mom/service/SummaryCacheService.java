package com.v_mom.service;

import jakarta.annotation.PreDestroy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.DoubleAdder;

@Service
public class SummaryCacheService {

  // raw summary storage
  private final Map<String, String> summaries = new ConcurrentHashMap<>();
  private final Map<String, Instant> timestamps = new ConcurrentHashMap<>();

  // progress%
  private final Map<String, Double> progress = new ConcurrentHashMap<>();

  // chunk tracking
  private final Map<String, Integer> initialChunks = new ConcurrentHashMap<>();
  private final Map<String, AtomicInteger> remainingChunks = new ConcurrentHashMap<>();

  // timing stats
  private final Map<String, AtomicInteger> processedCount = new ConcurrentHashMap<>();
  private final Map<String, DoubleAdder> totalTime = new ConcurrentHashMap<>();

  // timestamp tracking for more accurate ETAs
  private final Map<String, Long> startTimestamps = new ConcurrentHashMap<>();

  // ETA in seconds
  private final Map<String, Integer> etaMap = new ConcurrentHashMap<>();

  private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor();

  // Initial ETA calibration factor
  private static final int ETA_FACTOR = 3; // Much lower than 25

  // ——— progress methods ———
  public void setProgress(String uuid, double pct) {
    progress.put(uuid, pct);
  }
  public void incrementProgress(String uuid, double delta) {
    progress.merge(uuid, delta, Double::sum);
  }
  public Double getProgress(String uuid) {
    return progress.getOrDefault(uuid, 0.0);
  }
  public void removeProgress(String uuid) {
    progress.remove(uuid);
  }

  // ——— chunk/ETA setup ———
  public void setInitialChunks(String uuid, int total) {
    initialChunks.put(uuid, total);
    remainingChunks.put(uuid, new AtomicInteger(total));
    processedCount.put(uuid, new AtomicInteger(0));
    totalTime.put(uuid, new DoubleAdder());
    startTimestamps.put(uuid, System.currentTimeMillis());

    // Initialize with a reasonable baseline ETA - much lower than before
    etaMap.put(uuid, total * ETA_FACTOR);
  }

  /**
   * Call this *after* a chunk finishes, passing the real duration (secs).
   * It will decrement remaining, update totalTime & processedCount, then recompute ETA.
   */
  public void chunkProcessed(String uuid, double chunkSeconds) {
    AtomicInteger rem = remainingChunks.get(uuid);
    AtomicInteger proc = processedCount.get(uuid);
    DoubleAdder tot = totalTime.get(uuid);
    Long startTime = startTimestamps.get(uuid);

    if (rem == null || proc == null || tot == null || startTime == null) return;

    rem.decrementAndGet();
    proc.incrementAndGet();
    tot.add(chunkSeconds);

    int done = proc.get();
    int left = rem.get();
    int initial = initialChunks.getOrDefault(uuid, 0);

    if (done > 0 && left > 0 && initial > 0) {
      // Calculate ETA based on elapsed time, not just chunk processing time
      long elapsedMs = System.currentTimeMillis() - startTime;
      double elapsedSecs = elapsedMs / 1000.0;

      // Calculate how much time each % of progress is taking
      double progressPercent = (double)done / initial;
      double timePerProgressPercent = elapsedSecs / progressPercent;

      // Estimate time remaining based on percentage left
      double percentRemaining = (double)left / initial;
      int estimatedSecondsLeft = (int)Math.ceil(timePerProgressPercent * percentRemaining);

      // Apply a stabilizing factor to avoid wild fluctuations
      // This smooths out the ETA based on current and previous estimates
      Integer currentEta = etaMap.getOrDefault(uuid, 0);
      int newEta;

      if (currentEta > 0) {
        // Weighted average: 70% current estimate, 30% new measurement
        newEta = (int)Math.ceil(0.7 * currentEta + 0.3 * estimatedSecondsLeft);
      } else {
        newEta = estimatedSecondsLeft;
      }

      // Make sure ETA never goes up drastically
      if (newEta > currentEta * 1.5 && currentEta > 0) {
        newEta = (int)(currentEta * 1.5);
      }

      etaMap.put(uuid, newEta);
    }
  }

  public Integer getEta(String uuid) {
    return etaMap.getOrDefault(uuid, 0);
  }

  public void setEta(String uuid, int eta) {
    etaMap.put(uuid, eta);
  }

  // ——— summary storage ———
  public void storeSummary(String uuid, String summary) {
    summaries.put(uuid, summary);
    timestamps.put(uuid, Instant.now());
  }
  public boolean isSummaryReady(String uuid) {
    return summaries.containsKey(uuid);
  }
  public String retrieveAndRemoveSummary(String uuid) {
    timestamps.remove(uuid);
    return summaries.remove(uuid);
  }

  // ——— cleanup everything ———
  @Scheduled(fixedRate = 5 * 60 * 1000)
  public void cleanupOld() {
    Instant now = Instant.now();
    for (Map.Entry<String, Instant> e : timestamps.entrySet()) {
      if (now.minusSeconds(30*60).isAfter(e.getValue())) {
        cleanup(e.getKey());
      }
    }
  }

  public void cleanup(String uuid) {
    summaries.remove(uuid);
    timestamps.remove(uuid);
    progress.remove(uuid);
    initialChunks.remove(uuid);
    remainingChunks.remove(uuid);
    processedCount.remove(uuid);
    totalTime.remove(uuid);
    etaMap.remove(uuid);
    startTimestamps.remove(uuid);
  }

  @PreDestroy
  public void shutdown() {
    cleaner.shutdown();
  }
}