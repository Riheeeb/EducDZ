package com.educationonline.backend.mappers;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class IntegerListConverter implements AttributeConverter<Object, String> {
    
    private static final String SPLIT_CHAR = ",";

    @Override
    public String convertToDatabaseColumn(Object value) {
        if (value == null) {
            return "";
        }

        if (value instanceof List<?> list) {
            if (list.isEmpty()) {
                return "";
            }

            return list.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(SPLIT_CHAR));
        }

        return value.toString();
    }

    @Override
    public Object convertToEntityAttribute(String string) {
        if (string == null || string.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            return Arrays.stream(string.split(SPLIT_CHAR))
                .map(Integer::parseInt)
                .collect(Collectors.toList());
        } catch (NumberFormatException ex) {
            return string;
        }
    }
}
