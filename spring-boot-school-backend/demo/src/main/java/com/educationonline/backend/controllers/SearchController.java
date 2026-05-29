package com.educationonline.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.search.GlobalSearchResponse;
import com.educationonline.backend.services.SearchService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * Unified search: teachers (by name), published courses (title/description),
     * lessons/resources (lesson title or body text).
     */
    @GetMapping("/search")
    public ResponseEntity<GlobalSearchResponse> search(
            @RequestParam("q") String q,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(searchService.search(q, limit));
    }
}
