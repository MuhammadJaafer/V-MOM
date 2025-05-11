package com.v_mom.controller;

import com.v_mom.entity.Meeting;
import com.v_mom.entity.User;
import com.v_mom.repository.MeetingRepository;
import com.v_mom.security.CustomUserDetails;
import com.v_mom.service.AudioService;
import com.v_mom.service.LLMService;
import com.v_mom.service.SummaryService;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class VideoUploadController {
  @Autowired private MeetingRepository meetingRepository;
  private static final String REDIRECT_HOME = "redirect:/upload";
  private static final String MESSAGE_ATTR = "message";
  private final AudioService audioService;
  private final SummaryService summaryService;

  @Value("${upload.dir}")
  private String uploadDir;

  @Autowired
  public VideoUploadController(AudioService audioService, SummaryService summaryService) {
    this.audioService = audioService;
    this.summaryService = summaryService;
  }

  @GetMapping("/upload")
  public String home() {
    return "upload";
  }

  @PostMapping("/upload")
  public String handleFileUpload(
      @RequestParam("file") MultipartFile file, RedirectAttributes redirectAttributes) {

    if (file.isEmpty()) {
      addMessage(redirectAttributes, "Please select a file to upload.");
      return REDIRECT_HOME;
    }

    try {
      // Save the uploaded file
      File savedFile = saveUploadedFile(file);

      // Process the video file
      processVideoFile(savedFile, file.getOriginalFilename(), redirectAttributes);

    } catch (IOException e) {
      addMessage(redirectAttributes, "File upload failed: " + e.getMessage());
    } catch (Exception e) {
      addMessage(redirectAttributes, "Can't convert video to audio: " + e.getMessage());
    }

    return REDIRECT_HOME;
  }

  /**
   * Saves the uploaded file to the file system
   *
   * @param file The uploaded file
   * @return The saved file
   * @throws IOException If file saving fails
   */
  private File saveUploadedFile(MultipartFile file) throws IOException {
    // Generate unique filename
    String uniqueFileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
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

  /**
   * Processes the video file to extract audio
   *
   * @param videoFile The video file to process
   * @param originalFilename The original filename
   * @param redirectAttributes Redirect attributes for flash messages
   */
  private void processVideoFile(
      File videoFile, String originalFilename, RedirectAttributes redirectAttributes) {

    // Get the currently authenticated user
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
    User user = customUserDetails.getUser();

    // Save the meeting information to the database
    Meeting meeting = new Meeting();
    meeting.setTitle(originalFilename); // or set other fields as needed
    meeting.setUser(user); // set the authenticated user
    meetingRepository.save(meeting);

    // Convert video to audio
    String Text = audioService.extractAndTranscribe(videoFile, meeting);
    String summary = LLMService.summarizeTranscript(Text);
    summaryService.saveSummary(meeting,summary);

    if (!Text.isEmpty()) {
      addMessage(redirectAttributes, summary);
    } else {
      addMessage(redirectAttributes, "Video conversion failed");
    }
  }

  /**
   * Helper method to add flash messages
   *
   * @param redirectAttributes Redirect attributes for flash messages
   * @param message The message to add
   */
  private void addMessage(RedirectAttributes redirectAttributes, String message) {
    redirectAttributes.addFlashAttribute(MESSAGE_ATTR, message);
  }
}
