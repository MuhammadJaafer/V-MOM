package com.v_mom.service;

import com.google.genai.Client;
import com.google.genai.errors.ApiException;
import com.google.genai.types.GenerateContentResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class LLMService {

  private static final Logger LOGGER = Logger.getLogger(LLMService.class.getName());

  private static String apiKey;
  private static Client client;

  @Value("${openai.api.key}")
  public void setApiKey(String key) {
    apiKey = key;
  }

  @PostConstruct
  public void initClient() {
    client = Client.builder().apiKey(apiKey).build();
  }

  public static String summarizeTranscript(String transcript) {
    try {
      GenerateContentResponse response = client.models.generateContent(
          "gemini-2.0-flash",
          "Extract the following information from the meeting transcript and return your response as **pure JSON only**, matching the structure below. Do not include any commentary, explanation, or markdown formatting.\n"
              + "\n"
              + "JSON Format:\n"
              + "{\n"
              + "  \"meetingInfo\": {\n"
              + "    \"date\": \"YYYY-MM-DD\",\n"
              + "    \"title\": \"Meeting Title\",\n"
              + "    \"attendees\": [\"Name1\", \"Name2\", \"Name3\"]\n"
              + "  },\n"
              + "  \"keyPoints\": [\n"
              + "    \"Brief point 1\",\n"
              + "    \"Brief point 2\"\n"
              + "  ],\n"
              + "  \"actionItems\": [\n"
              + "    {\n"
              + "      \"id\": 1,\n"
              + "      \"description\": \"Describe the action clearly\",\n"
              + "      \"owner\": \"Responsible person's name\",\n"
              + "      \"dueDate\": \"YYYY-MM-DD\",\n"
              + "      \"status\": \"Pending | In Progress | Done\",\n"
              + "      \"priority\": \"High | Medium | Low\"\n"
              + "    }\n"
              + "  ],\n"
              + "  \"decisions\": [\n"
              + "    {\n"
              + "      \"description\": \"What was decided\",\n"
              + "      \"rationale\": \"Why the decision was made\",\n"
              + "      \"decidedBy\": \"Person or group who made the decision\"\n"
              + "    }\n"
              + "  ]\n"
              + "}\n"
              + "Transcript:\n" + transcript,
          null
      );

      if (response == null || response.text() == null || response.text().isEmpty()) {
        LOGGER.warning("Empty or null response from Gemini.");
        return "{}";
      }

      System.out.println("Gemini response: " + response.text());
      return response.text();

    } catch (ApiException e) {
      LOGGER.log(Level.SEVERE, "Gemini API error: " + e.getMessage(), e);
    } catch (Exception e) {
      LOGGER.log(Level.SEVERE, "Unexpected error during transcript summarization: " + e.getMessage(), e);
    }

    return "{}";
  }
}
