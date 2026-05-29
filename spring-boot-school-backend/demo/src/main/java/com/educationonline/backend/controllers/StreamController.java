package com.educationonline.backend.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.SubstreamDto;
import com.educationonline.backend.entities.Streams;
import com.educationonline.backend.entities.substream;
import com.educationonline.backend.mappers.SubstreamMapper;
import com.educationonline.backend.repositories.StreamRepository;
import com.educationonline.backend.repositories.substreamRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class StreamController {

    private final StreamRepository streamRepository;
    private final substreamRepository substreamRepository;

    // GET /api/v1/streams/by-year/{yearId}
    // returns all streams for a given year id
    @GetMapping("/streams/by-year/{yearId}")
    public ResponseEntity<List<Streams>> getStreamsByYear(@PathVariable Long yearId) {
        return ResponseEntity.ok(
            streamRepository.findByYearId(yearId)
        );
    }

    // GET /api/v1/substreams/by-stream/{streamId}
    // returns all substreams for a given stream id
    @GetMapping("/substreams/by-stream/{streamId}")
    public ResponseEntity<List<SubstreamDto>> getSubstreamsByStream(@PathVariable Long streamId) {
        return ResponseEntity.ok(
            substreamRepository.findByStreamsId(streamId).stream().map(SubstreamMapper::toDto).toList()
        );
    }
}
