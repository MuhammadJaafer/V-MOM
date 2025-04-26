package com.v_mom.service;

import com.google.cloud.speech.v1.RecognitionAudio;
import com.google.cloud.speech.v1.RecognitionConfig;
import com.google.cloud.speech.v1.RecognizeResponse;
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.SpeechRecognitionAlternative;
import com.google.cloud.speech.v1.SpeechRecognitionResult;
import com.google.common.util.concurrent.RateLimiter;
import com.google.protobuf.ByteString;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import org.springframework.stereotype.Service;
import ws.schild.jave.Encoder;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.encode.AudioAttributes;
import ws.schild.jave.encode.EncodingAttributes;

@Service
public class AudioService {

  private static final String VOICE_DIR      = "voice";
  private static final String CHUNKS_DIR     = "voice/chunks";
  private static final String WAV_EXTENSION  = ".wav";
  private static final String WAV_FORMAT     = "wav";
  private static final String WAV_CODEC      = "pcm_s16le";
  private static final int    BITRATE        = 64_000;
  private static final int    CHANNELS       = 1;       // mono
  private static final int    SAMPLING_RATE  = 16_000;  // recommended
  private static final int    CHUNK_DURATION = 30;      // seconds

  // Concurrency settings based on Google Speech-to-Text quotas
  private static final double REQUESTS_PER_SECOND = 15.0;
  private static final int    MAX_CONCURRENT_THREADS = 30;
  private static final long   AWAIT_TERMINATION_MINUTES = 10;

  /**
   * Extracts audio from a video, splits into uniquely named chunks,
   * transcribes them in parallel (throttled), and returns the full transcript.
   *
   * @param videoFile video file to process
   * @return combined transcription text, or null on failure
   */
  public String extractAndTranscribe(File videoFile) {
    if (videoFile == null || !videoFile.exists()) {
      return null;
    }

    String baseName = videoFile.getName().replaceFirst("[.][^.]+$", "");
    File voiceDir = new File(VOICE_DIR);
    File chunksDir = new File(CHUNKS_DIR);
    voiceDir.mkdirs();
    chunksDir.mkdirs();
    File wavFile = new File(voiceDir, baseName + WAV_EXTENSION);

    try {
      // 1) Convert video to WAV (mono, 16kHz)
      convertVideoToWav(videoFile, wavFile);

      // 2) Split WAV into uniquely named chunks
      List<File> chunkFiles = splitWavFile(wavFile, baseName, CHUNK_DURATION, chunksDir);

      // 3) Transcribe chunks in parallel with rate limiting
      List<String> transcripts = transcribeChunksConcurrently(chunkFiles);

      // 4) Stitch together
      StringBuilder fullTranscript = new StringBuilder();
      for (String part : transcripts) {
        fullTranscript.append(part).append("\n");
      }
      return fullTranscript.toString().trim();
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    } finally {
      cleanupFile(videoFile);
      cleanupFile(wavFile);
      for (File f : Arrays.copyOf(chunksDir.listFiles(), chunksDir.listFiles().length)) {
        cleanupFile(f);
      }
    }
  }

  private void convertVideoToWav(File videoFile, File outputAudioFile) throws Exception {
    AudioAttributes audio = new AudioAttributes();
    audio.setCodec(WAV_CODEC);
    audio.setBitRate(BITRATE);
    audio.setChannels(CHANNELS);
    audio.setSamplingRate(SAMPLING_RATE);

    EncodingAttributes attrs = new EncodingAttributes();
    attrs.setOutputFormat(WAV_FORMAT);
    attrs.setAudioAttributes(audio);

    new Encoder().encode(new MultimediaObject(videoFile), outputAudioFile, attrs);
  }

  private List<File> splitWavFile(File inputWav, String baseName, int seconds, File outputDir) throws Exception {
    List<File> chunks = new ArrayList<>();
    try (AudioInputStream inputStream = AudioSystem.getAudioInputStream(inputWav)) {
      AudioFormat format = inputStream.getFormat();
      long bytesPerSecond = (long) (format.getFrameSize() * format.getFrameRate());
      long chunkBytes = seconds * bytesPerSecond;
      byte[] buffer = new byte[(int) chunkBytes];

      int bytesRead, idx = 0;
      while ((bytesRead = inputStream.read(buffer)) > 0) {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(buffer, 0, bytesRead);
            AudioInputStream chunkStream = new AudioInputStream(bais, format, bytesRead / format.getFrameSize())) {

          File chunkFile = new File(outputDir, String.format("%s_chunk_%03d.wav", baseName, idx++));
          AudioSystem.write(chunkStream, AudioFileFormat.Type.WAVE, chunkFile);
          chunks.add(chunkFile);
        }
      }
    }
    return chunks;
  }

  private List<String> transcribeChunksConcurrently(List<File> chunkFiles) throws InterruptedException {
    RateLimiter limiter = RateLimiter.create(REQUESTS_PER_SECOND);
    ExecutorService exec = Executors.newFixedThreadPool(MAX_CONCURRENT_THREADS);
    List<Future<String>> futures = new ArrayList<>();

    for (File chunk : chunkFiles) {
      limiter.acquire(); // throttle to avoid exceeding QPS
      futures.add(exec.submit((Callable<String>) () -> {
        try {
          return transcribeAudio(chunk);
        } catch (Exception e) {
          throw new RuntimeException("Transcription failed for " + chunk.getName(), e);
        }
      }));
    }

    exec.shutdown();
    exec.awaitTermination(AWAIT_TERMINATION_MINUTES, TimeUnit.MINUTES);

    List<String> results = new ArrayList<>();
    for (Future<String> f : futures) {
      try {
        results.add(f.get());
      } catch (ExecutionException e) {
        results.add("[ERROR: " + e.getCause().getMessage() + "]");
      }
    }
    return results;
  }

  private String transcribeAudio(File audioFile) throws Exception {
    try (SpeechClient speechClient = SpeechClient.create()) {
      byte[] data = Files.readAllBytes(audioFile.toPath());
      ByteString audioBytes = ByteString.copyFrom(data);

      RecognitionConfig config = RecognitionConfig.newBuilder()
          .setEncoding(RecognitionConfig.AudioEncoding.LINEAR16)
          .setLanguageCode("en-US")
          .setSampleRateHertz(SAMPLING_RATE)
          .build();

      RecognitionAudio audio = RecognitionAudio.newBuilder()
          .setContent(audioBytes)
          .build();
      System.out.println("Send audio to Google Speech API: " + audioFile.getName());
      RecognizeResponse response = speechClient.recognize(config, audio);

      StringBuilder transcript = new StringBuilder();
      for (SpeechRecognitionResult result : response.getResultsList()) {
        SpeechRecognitionAlternative alt = result.getAlternativesList().get(0);
        transcript.append(alt.getTranscript()).append("\n");
      }
      return transcript.toString().trim();
    }
  }

  private void cleanupFile(File file) {
    if (file != null && file.exists() && !file.delete()) {
      file.deleteOnExit();
    }
  }
}
