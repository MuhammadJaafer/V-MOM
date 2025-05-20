package com.v_mom.repository;

import com.v_mom.entity.Meeting;
import com.v_mom.entity.Transcript;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TranscriptRepository extends JpaRepository<Transcript, Long> {
    Optional<Transcript> findByMeeting(Meeting meeting);
    Transcript findFirstByMeeting(Meeting meeting);
  Transcript findByTranscriptId(String uuid);
}
