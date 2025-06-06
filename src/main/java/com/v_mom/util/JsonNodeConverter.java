package com.v_mom.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class JsonNodeConverter implements AttributeConverter<JsonNode, String> {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public String convertToDatabaseColumn(JsonNode attribute) {
    try {
      return attribute != null ? objectMapper.writeValueAsString(attribute) : null;
    } catch (Exception e) {
      throw new IllegalArgumentException("Could not serialize JSON", e);
    }
  }

  @Override
  public JsonNode convertToEntityAttribute(String dbData) {
    try {
      return dbData != null ? objectMapper.readTree(dbData) : null;
    } catch (Exception e) {
      throw new IllegalArgumentException("Could not deserialize JSON", e);
    }
  }
}