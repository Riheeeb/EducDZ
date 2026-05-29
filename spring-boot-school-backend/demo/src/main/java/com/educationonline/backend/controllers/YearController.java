package com.educationonline.backend.controllers;

import com.educationonline.backend.dtos.StreamDto;
import com.educationonline.backend.entities.Years;
import com.educationonline.backend.services.YearService;
import com.educationonline.backend.repositories.yearRepo;
import com.educationonline.backend.services.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class YearController {

    private final yearRepo yearRepository;
    private final YearService yearService;
    private final CourseService courseService;

    //All years
    @GetMapping("/years")
    public ResponseEntity<List<Years>> getAllYears() {
        return ResponseEntity.ok(yearRepository.findAll());
    }

    //All years ordered
    @GetMapping("/years/sequence")
    public ResponseEntity<List<Years>> getYearsInSequence() {
        return ResponseEntity.ok(yearService.getAllYearsInOrder());
    }

    //middle school years
    @GetMapping("/years/middle-school")
    public ResponseEntity<List<Years>> getMiddleSchoolYears() {
        return ResponseEntity.ok(yearService.getMiddleSchoolYears());
    }

    //high school years
     
    @GetMapping("/years/high-school")
    public ResponseEntity<List<Years>> getHighSchoolYears() {
        return ResponseEntity.ok(yearService.getHighSchoolYears());
    }

    //specific year by label
    @GetMapping("/years/label/{label}")
    public ResponseEntity<Years> getYearByLabel(@PathVariable String label) {
        return yearService.getYearByLabel(label)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    //the next year after a given year label
    @GetMapping("/years/{label}/next")
    public ResponseEntity<Years> getNextYear(@PathVariable String label) {
        return yearService.getNextYear(label)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    //stream for a given year
    @GetMapping("/years/{yearId}/streams")
    public ResponseEntity<List<StreamDto>> getStreams(@PathVariable Long yearId) {
        List<StreamDto> streams = courseService.getStreamsByYear(yearId);
        return ResponseEntity.ok(streams);
    }

    //is last year (3AS)
    @GetMapping("/years/{label}/is-last")
    public ResponseEntity<Boolean> isLastYear(@PathVariable String label) {
        return ResponseEntity.ok(yearService.isLastYear(label));
    }

    //is first year (1AM)
    @GetMapping("/years/{label}/is-first")
    public ResponseEntity<Boolean> isFirstYear(@PathVariable String label) {
        return ResponseEntity.ok(yearService.isFirstYear(label));
    }
}