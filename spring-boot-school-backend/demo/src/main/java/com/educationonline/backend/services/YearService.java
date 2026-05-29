package com.educationonline.backend.services;

import com.educationonline.backend.entities.Years;
import com.educationonline.backend.entities.Years.yearValue;
import com.educationonline.backend.repositories.yearRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class YearService {

    private final yearRepo yearRepository;

    /**
    1AM → 2AM → 3AM → 4AM → 1AS → 2AS → 3AS
     */
    public Optional<Years> getNextYear(String currentYearLabel) {
        try {
            yearValue currentYear = yearValue.fromValue(currentYearLabel);
            yearValue nextYear = getNextYearEnum(currentYear);
            
            if (nextYear != null) {
                return yearRepository.findByYear(nextYear);
            }
            return Optional.empty();
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /**
     * Get next year enum value based on progression
     * 1AM → 2AM → 3AM → 4AM → 1AS → 2AS → 3AS → null
     */
    private yearValue getNextYearEnum(yearValue current) {
        return switch (current) {
            case Y1_AM -> yearValue.Y2_AM;
            case Y2_AM -> yearValue.Y3_AM;
            case Y3_AM -> yearValue.Y4_AM;
            case Y4_AM -> yearValue.Y1_AS;  // Transition from middle to high school
            case Y1_AS -> yearValue.Y2_AS;
            case Y2_AS -> yearValue.Y3_AS;
            case Y3_AS -> null;  // Last year, no next year
        };
    }

    public Optional<Years> getYearByLabel(String label) {
        try {
            yearValue yearVal = yearValue.fromValue(label);
            return yearRepository.findByYear(yearVal);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /**
     * Get all years in sequence order
     */
    public List<Years> getAllYearsInOrder() {
        List<yearValue> sequence = List.of(
                yearValue.Y1_AM,
                yearValue.Y2_AM,
                yearValue.Y3_AM,
                yearValue.Y4_AM,
                yearValue.Y1_AS,
                yearValue.Y2_AS,
                yearValue.Y3_AS
        );

        return sequence.stream()
                .flatMap(yearVal -> yearRepository.findByYear(yearVal).stream())
                .toList();
    }

    /**
     * Check if a year is the last year (3AS)
     */
    public boolean isLastYear(String yearLabel) {
        try {
            yearValue year = yearValue.fromValue(yearLabel);
            return year == yearValue.Y3_AS;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Check if a year is the first year (1AM)
     */
    public boolean isFirstYear(String yearLabel) {
        try {
            yearValue year = yearValue.fromValue(yearLabel);
            return year == yearValue.Y1_AM;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Get all middle school years (1AM - 4AM)
     */
    public List<Years> getMiddleSchoolYears() {
        return yearRepository.findAll().stream()
                .filter(y -> y.getYear().isMiddleSchool())
                .toList();
    }

    /**
     * Get all high school years (1AS - 3AS)
     */
    public List<Years> getHighSchoolYears() {
        return yearRepository.findAll().stream()
                .filter(y -> y.getYear().isHighSchool())
                .toList();
    }
}
