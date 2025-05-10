package com.v_mom.controller;

import com.v_mom.service.AudioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Controller
public class VideoUploadController {

  private static final String REDIRECT_HOME = "redirect:/upload";
  private static final String MESSAGE_ATTR = "message";

  private final AudioService audioService;

  @Value("${upload.dir}")
  private String uploadDir;

  @Autowired
  public VideoUploadController(AudioService audioService) {
    this.audioService = audioService;
  }

  @GetMapping("/upload")
  public String home() {
    return "upload";
  }

  @PostMapping("/upload")
  public String handleFileUpload(
      @RequestParam("file") MultipartFile file,
      RedirectAttributes redirectAttributes) {

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
      File videoFile,
      String originalFilename,
      RedirectAttributes redirectAttributes) {

    // Convert video to audio
    String Text = audioService.extractAndTranscribe(videoFile);

    if (!Text.isEmpty()) {
      addMessage(redirectAttributes,  Text);
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