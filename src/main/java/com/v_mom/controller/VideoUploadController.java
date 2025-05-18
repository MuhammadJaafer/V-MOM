package com.v_mom.controller;

import com.v_mom.entity.Meeting;
import com.v_mom.entity.User;
import com.v_mom.entity.Summary;
import com.v_mom.entity.Transcript;
import com.v_mom.repository.MeetingRepository;
import com.v_mom.repository.SummaryRepository;
import com.v_mom.repository.TranscriptRepository;
import com.v_mom.security.CustomUserDetails;
import com.v_mom.service.AudioService;
import com.v_mom.service.LLMService;
import com.v_mom.service.SummaryCacheService;
import com.v_mom.service.SummaryService;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class VideoUploadController {
  @Autowired private MeetingRepository meetingRepository;
  @Autowired private TranscriptRepository transcriptRepository;
  @Autowired private SummaryRepository summaryRepository;

  private static final String REDIRECT_UPLOAD = "redirect:/upload";
  private static final String UPLOAD_VIEW = "upload";
  private static final String MESSAGE_ATTR = "message";
  private static final String ORIGINAL_TEXT_ATTR = "originalText";
  private final AudioService audioService;
  private final SummaryService summaryService;
  private final SummaryCacheService summaryCacheService;
  @Value("${upload.dir}")
  private String uploadDir;

  @Autowired
  public VideoUploadController(AudioService audioService, SummaryService summaryService,
      SummaryCacheService summaryCacheService)  {
    this.audioService = audioService;
    this.summaryService = summaryService;
  this.summaryCacheService = summaryCacheService;
  }

  @GetMapping("/upload")
  public String home(@RequestParam(required = false) Long meetingId, Model model) {
    // Check if a specific meeting was requested
    if (meetingId != null) {
      loadExistingMeeting(meetingId, model);
    }

    return UPLOAD_VIEW;
  }

  /**
   * Load an existing meeting's data
   *
   * @param meetingId The ID of the meeting to load
   * @param model The Spring model to add attributes to
   */
  private void loadExistingMeeting(Long meetingId, Model model) {
    // Get the currently authenticated user
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
    User currentUser = customUserDetails.getUser();

    // Find the requested meeting
    Meeting meeting = meetingRepository.findByMeetingId(meetingId);

    // Verify the meeting exists and belongs to the current user
    if (meeting != null && meeting.getUser().getUserId().equals(currentUser.getUserId())) {
      // Find the transcript for this meeting
      Optional<Transcript> transcript = transcriptRepository.findByMeeting(meeting);
      if (transcript.isPresent()) {
        model.addAttribute(ORIGINAL_TEXT_ATTR, transcript.get().getContent());
      }

      // Find the summary for this meeting
      Optional<Summary> summary = summaryRepository.findByMeeting(meeting);
      if (summary.isPresent()) {
        model.addAttribute(MESSAGE_ATTR, summary.get().getMoM().toString());
      }
    }
  }

  @GetMapping("/poll-summary")
  @ResponseBody
  public ResponseEntity<?> pollSummary(@RequestParam("uuid") String uuid) {
    if (summaryCacheService.isSummaryReady(uuid)) {
      String summary = summaryCacheService.retrieveAndRemoveSummary(uuid);
//      String originalText = summaryCacheService.getOriginalText(uuid);
      return ResponseEntity.ok(Map.of("status", "done", "summary", summary));
    }

    Integer percent = summaryCacheService.getProgress(uuid);
    if (percent == null) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(Map.of("status", "not_found", "message", "Invalid or expired UUID"));
    }

    return ResponseEntity.ok(Map.of("status", "processing", "progress", percent));
  }

  @PostMapping("/upload")
  @ResponseBody
  public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
      return ResponseEntity.badRequest().body("File is empty.");
    }

    // Generate unique file name
    String uuid = UUID.randomUUID().toString();
    String uniqueFileName = uuid + "-" + file.getOriginalFilename();

    try {
      // Save the uploaded file
      File savedFile = saveUploadedFile(file, uniqueFileName);

      // Capture the current authentication object
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

      // Run processing in background (async) and pass auth object
      CompletableFuture.runAsync(() -> {
        try {
          SecurityContextHolder.setContext(SecurityContextHolder.createEmptyContext());
          SecurityContextHolder.getContext().setAuthentication(authentication);

          processVideoFile(savedFile, file.getOriginalFilename(), uuid);
        } catch (Exception e) {
          e.printStackTrace(); // or use a logger
        }
      });
      summaryCacheService.setProgress(uuid, 5);
      // Return just the UUID part
      return ResponseEntity.ok(uuid);

    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed: " + e.getMessage());
    }
  }


  /**
   * Saves the uploaded file to the file system
   *
   * @param file The uploaded file
   * @return The saved file
   * @throws IOException If file saving fails
   */
  private File saveUploadedFile(MultipartFile file, String uniqueFileName ) throws IOException {
    Path uploadPath = Paths.get(uploadDir, uniqueFileName);

    // Create directory if it doesn't exist
    File parentDir = uploadPath.getParent().toFile();
    if (!parentDir.exists()) {
      parentDir.mkdirs();
    }

    // Save the file
    file.transferTo(uploadPath);

    return uploadPath.toFile();
  }

  private void processVideoFile(File videoFile, String originalFilename, String uuid) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
    User user = customUserDetails.getUser();

    Meeting meeting = new Meeting();
    meeting.setTitle(originalFilename);
    meeting.setUser(user);
    meetingRepository.save(meeting);

    summaryCacheService.setProgress(uuid, 25);
    String text = audioService.extractAndTranscribe(videoFile, meeting);
    summaryCacheService.setProgress(uuid, 60);

    String summary = LLMService.summarizeTranscript(text);
    summaryCacheService.setProgress(uuid, 90);

    summaryService.saveSummary(meeting, summary);
    summaryCacheService.storeSummary(uuid, summary);

    summaryCacheService.removeProgress(uuid);
  }

  /**
   * Helper method to add flash messages
   *
   * @param redirectAttributes Redirect attributes for flash messages
   * @param message The message to add
   */
  private void addMessage(RedirectAttributes redirectAttributes, String message) {
//    redirectAttributes.addFlashAttribute(MESSAGE_ATTR, message);
  }
}
