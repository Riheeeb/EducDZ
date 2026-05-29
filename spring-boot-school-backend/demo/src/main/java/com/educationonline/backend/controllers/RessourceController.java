package com.educationonline.backend.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.educationonline.backend.entities.Ressources;
import com.educationonline.backend.repositories.RessourceRepository;

import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class RessourceController {

    private final RessourceRepository ressourceRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/resources/{id}")
    public ResponseEntity<Ressources> getResource(@PathVariable Long id) {
        return ressourceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/resources/files/{filename:.+}")
    public ResponseEntity<UrlResource> getResourceFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, "resources")
                    .resolve(filename)
                    .normalize();
            Path uploadPath = Paths.get(uploadDir, "resources").toAbsolutePath().normalize();

            if (!filePath.toAbsolutePath().startsWith(uploadPath) || !Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            UrlResource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);

            return ResponseEntity.ok()
                    .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filePath.getFileName() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/resources/upload")
    public ResponseEntity<Ressources> uploadResource(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            
            Path uploadPath = Paths.get(uploadDir, "resources");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            Ressources resource = new Ressources();
            resource.setPdfUrl("/api/v1/resources/files/" + uniqueFilename);
            Ressources saved = ressourceRepository.save(resource);

            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
