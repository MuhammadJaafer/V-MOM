package com.v_mom.controller;

import com.v_mom.entity.Meeting;
import com.v_mom.entity.Transcript;
import com.v_mom.repository.TranscriptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meetings")
public class TranscriptController {

    @Autowired
    private TranscriptRepository transcriptRepository;

    /**
     * Endpoint to retrieve the original transcript text for a specific meeting
     * @param meetingId The ID of the meeting
     * @return The transcript text or 404 if not found
     */
    @GetMapping("/{meetingId}/transcript")
    public ResponseEntity<String> getMeetingTranscript(@PathVariable Long meetingId) {
        // Create a meeting object with the provided ID to use for the query
        Meeting meeting = new Meeting();
        meeting.setMeetingId(meetingId);

        // Find transcript for this meeting
        Transcript transcript = transcriptRepository.findFirstByMeeting(meeting);

        if (transcript != null && transcript.getContent() != null) {
            return ResponseEntity.ok(transcript.getContent());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No transcript found for meeting ID: " + meetingId);
        }
    }
}