package com.v_mom.service;

import java.io.File;
import org.springframework.stereotype.Service;
import ws.schild.jave.Encoder;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.encode.AudioAttributes;
import ws.schild.jave.encode.EncodingAttributes;

@Service
public class AudioService {

  private static final String VOICE_DIR = "voice";
  private static final String MP3_EXTENSION = ".mp3";
  private static final String MP3_FORMAT = "mp3";
  private static final String MP3_CODEC = "libmp3lame";
  private static final int BITRATE = 64000;
  private static final int CHANNELS = 2;
  private static final int SAMPLING_RATE = 44100;

  /**
   * Extracts audio from a video file and saves it as MP3.
   *
   * @param videoFile The source video file
   * @return true if extraction was successful, false otherwise
   */
  public boolean extractAudioFromVideo(File videoFile) {
    if (videoFile == null || !videoFile.exists()) {
      return false;
    }

    String originalFilename = videoFile.getName();
    if (!originalFilename.contains(".")) {
      cleanupFile(videoFile);
      return false;
    }

    String baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
    File outputAudioFile = prepareOutputFile(baseName);

    try {
      convertVideoToMp3(videoFile, outputAudioFile);
      return outputAudioFile.exists();
    } catch (Exception e) {
      e.printStackTrace();
      return false;
    } finally {
      // Clean up the video file after processing
      cleanupFile(videoFile);
    }
  }

  /**
   * Prepares the output directory and file for the extracted audio.
   *
   * @param baseName The base name for the output file
   * @return The output file object
   */
  private File prepareOutputFile(String baseName) {
    // Create voice directory if it doesn't exist
    File voiceDir = new File(VOICE_DIR);
    if (!voiceDir.exists()) {
      voiceDir.mkdirs();
    }

    return new File(VOICE_DIR, baseName + MP3_EXTENSION);
  }

  /**
   * Converts a video file to MP3 audio format.
   *
   * @param videoFile The source video file
   * @param outputAudioFile The destination audio file
   * @throws Exception If encoding fails
   */
  private void convertVideoToMp3(File videoFile, File outputAudioFile) throws Exception {
    // Configure audio attributes
    AudioAttributes audio = new AudioAttributes();
    audio.setCodec(MP3_CODEC);
    audio.setBitRate(BITRATE);
    audio.setChannels(CHANNELS);
    audio.setSamplingRate(SAMPLING_RATE);

    // Configure encoding attributes
    EncodingAttributes encodingAttrs = new EncodingAttributes();
    encodingAttrs.setOutputFormat(MP3_FORMAT);
    encodingAttrs.setAudioAttributes(audio);

    // Perform encoding
    MultimediaObject multimediaObject = new MultimediaObject(videoFile);
    new Encoder().encode(multimediaObject, outputAudioFile, encodingAttrs);
  }

  /**
   * Safely deletes a file if it exists
   *
   * @param file The file to delete
   */
  private void cleanupFile(File file) {
    if (file != null && file.exists()) {
      boolean deleted = file.delete();
      if (!deleted) {
        file.deleteOnExit(); // Attempt to delete on JVM exit if immediate deletion fails
      }
    }
  }
}