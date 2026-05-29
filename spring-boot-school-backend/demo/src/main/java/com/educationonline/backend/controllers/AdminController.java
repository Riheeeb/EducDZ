package com.educationonline.backend.controllers;

import java.util.List;
 
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.educationonline.backend.dtos.AdminStatsDto;
import com.educationonline.backend.entities.*;
import com.educationonline.backend.services.AdminService;
 
import lombok.RequiredArgsConstructor;
 
@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
 
    //  STATS
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }
    /**
     * GET /api/v1/admin/users?page=0&size=20
     * All users (students + teachers).
     */
    @GetMapping("/users")
    public ResponseEntity<Page<users>> getAllUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(page, size));
    }
 
    /**
     * GET /api/v1/admin/users/{id}
     * Get any user by id.
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<users> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }
 
    /**
     * DELETE /api/v1/admin/users/{id}
     * Delete a user account permanently.
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
 
    /**
     * PUT /api/v1/admin/users/{id}/ban
     * Ban a user — blocks their login.
     */
    @PutMapping("/users/{id}/ban")
    public ResponseEntity<users> banUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.banUser(id));
    }
 
    /**
     * PUT /api/v1/admin/users/{id}/unban
     * Unban a user — restores their login.
     */
    @PutMapping("/users/{id}/unban")
    public ResponseEntity<users> unbanUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unbanUser(id));
    }
 
    /**
     * GET /api/v1/admin/students?page=0&size=20
     */
    @GetMapping("/students")
    public ResponseEntity<Page<users>> getAllStudents(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllStudents(page, size));
    }
 
    /**
     * GET /api/v1/admin/teachers?page=0&size=20
     */
    @GetMapping("/teachers")
    public ResponseEntity<Page<users>> getAllTeachers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllTeachers(page, size));
    }
 
    
    //  COURSES
    
 
    /**
     * GET /api/v1/admin/courses?page=0&size=20
     */
    @GetMapping("/courses")
    public ResponseEntity<Page<Courses>> getAllCourses(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllCourses(page, size));
    }
 
    /**
     * DELETE /api/v1/admin/courses/{id}
     * Force delete any course.
     */
    @DeleteMapping("/courses/{id}")
    public ResponseEntity<Void> forceDeleteCourse(@PathVariable Long id) {
        adminService.forceDeleteCourse(id);
        return ResponseEntity.noContent().build();
    }
 
    /**
     * PUT /api/v1/admin/courses/{id}/unpublish
     * Hide a course that violates platform rules.
     */
    @PutMapping("/courses/{id}/unpublish")
    public ResponseEntity<Courses> unpublishCourse(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unpublishCourse(id));
    }
 
    
    //  SUBJECTS
     
    @GetMapping("/subjects")
    public ResponseEntity<List<subjects>> getAllSubjects() {
        return ResponseEntity.ok(adminService.getAllSubjects());
    }
  
    /**
     * POST /api/v1/admin/subjects
     */
    @PostMapping("/subjects")
    public ResponseEntity<subjects> createSubject(@RequestBody subjects subject) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createSubject(subject));
    }
 
    /**
     * PUT /api/v1/admin/subjects/{id}
     */
    @PutMapping("/subjects/{id}")
    public ResponseEntity<subjects> renameSubject(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(adminService.renameSubject(id, body.get("name")));
    }
 
  
    @GetMapping("/years")
    public ResponseEntity<List<Years>> getAllAdminYears() {
        return ResponseEntity.ok(adminService.getAllAdminYears());
    }

    //  STREAMS
     
    @GetMapping("/streams")
    public ResponseEntity<List<Streams>> getAllStreams() {
        return ResponseEntity.ok(adminService.getAllStreams());
    }
  
    /**
     * POST /api/v1/admin/streams
     * Body: { stream fields }
     */
    @PostMapping("/streams")
    public ResponseEntity<Streams> createStream(@RequestBody Streams stream) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createStream(stream));
    }
 
  
    //  BADGES
   
 
    /**
     * GET /api/v1/admin/badges
     * All badges in the system.
     */
    @GetMapping("/badges")
    public ResponseEntity<List<Badges>> getAllBadges() {
        return ResponseEntity.ok(adminService.getAllBadges());
    }
 
    /**
     * POST /api/v1/admin/badges
     * Body: {
     *   "code": "FIRST_LESSON",
     *   "name": "First Steps",
     *   "description": "Complete your first lesson",
     *   "tier": "BRONZE",
     *   "trigger": "FIRST_LESSON",
     *   "bonusPoints": 10
     * }
     */
    @PostMapping("/badges")
    public ResponseEntity<Badges> createBadge(@RequestBody Badges badge) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createBadge(badge));
    }
 
    /**
     * PUT /api/v1/admin/badges/{id}
     * Only updates fields that are provided.
     */
    @PutMapping("/badges/{id}")
    public ResponseEntity<Badges> updateBadge(
            @PathVariable Long id,
            @RequestBody Badges updated) {
        return ResponseEntity.ok(adminService.updateBadge(id, updated));
    }
 
    /**
     * DELETE /api/v1/admin/badges/{id}
     */
    @DeleteMapping("/badges/{id}")
    public ResponseEntity<Void> deleteBadge(@PathVariable Long id) {
        adminService.deleteBadge(id);
        return ResponseEntity.noContent().build();
    }


}

