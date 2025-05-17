package com.v_mom.controller;

import com.v_mom.entity.Meeting;
import com.v_mom.entity.User;
import com.v_mom.repository.MeetingRepository;
import com.v_mom.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
public class MeetingHistoryController {

    @Autowired
    private MeetingRepository meetingRepository;

    /**
     * Endpoint to retrieve the meeting history for the currently authenticated user
     * @return List of meetings for the current user
     */
    @GetMapping("/history")
    public ResponseEntity<List<Meeting>> getMeetingHistory() {
        // Get the currently authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = customUserDetails.getUser();

        // Find all meetings for this user, ordered by date (newest first)
        List<Meeting> meetings = meetingRepository.findByUserOrderByMeetingDateDesc(user);

        return ResponseEntity.ok(meetings);
    }
}