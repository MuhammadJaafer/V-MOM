package com.v_mom.repository;

import com.v_mom.entity.Meeting;
import com.v_mom.entity.Summary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SummaryRepository extends JpaRepository<Summary, Long> {

    Optional<Summary> findByMeeting(Meeting meeting);
}
