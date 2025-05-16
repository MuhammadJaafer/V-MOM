package com.v_mom.repository;

import com.v_mom.entity.Meeting;
import com.v_mom.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;


public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByUserOrderByMeetingDateDesc(User user);

    Meeting findByMeetingId(Long meetingId);



}
