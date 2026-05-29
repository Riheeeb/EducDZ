package com.educationonline.backend.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.AuthDTOs.AuthResponse;
import com.educationonline.backend.dtos.AuthDTOs.ErrorResponse;
import com.educationonline.backend.dtos.AuthDTOs.LoginRequest;
import com.educationonline.backend.dtos.AuthDTOs.LoginResponse;
import com.educationonline.backend.dtos.AuthDTOs.StudentRegisterRequest;
import com.educationonline.backend.dtos.AuthDTOs.TeacherRegisterRequest;
import com.educationonline.backend.services.JwtService;
import com.educationonline.backend.services.TokenBlacklistService;
import com.educationonline.backend.services.authoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthoController {

    private final authoService authoService;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthoController(
            authoService authoService,
            JwtService jwtService,
            TokenBlacklistService tokenBlacklistService) {
        this.authoService = authoService;
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authoService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            String errorMessage = e.getMessage();
            if (errorMessage.equals("user not found") || errorMessage.equals("invalid password")) {
                return ResponseEntity.status(401).body(createErrorResponse("UNAUTHORIZED", errorMessage));
            }

            if (errorMessage.equals("user account is enabled")) {
                return ResponseEntity.status(403).body(createErrorResponse("Account disabled", errorMessage));
            }

            return ResponseEntity.badRequest().body(createErrorResponse("Bad Request", errorMessage));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(createErrorResponse("SERVER_ERROR", "An unexpected error occurred"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.validateToken(token)) {
                tokenBlacklistService.blacklistToken(token, jwtService.extractExpiration(token));
            }
        }

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private ErrorResponse createErrorResponse(String error, String message) {
        return new ErrorResponse(false, message, error, null);
    }

    @PostMapping("/register/student")
    public ResponseEntity<AuthResponse> registernewstudent(@Valid @RequestBody StudentRegisterRequest studentrqt) {
        AuthResponse response = authoService.addNewStudent(studentrqt);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/teacher")
    public ResponseEntity<AuthResponse> registernewteacher(@Valid @RequestBody TeacherRegisterRequest teacher) {
        AuthResponse response = authoService.addNewTeacher(teacher);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public String test() {
        return "Autho Controller is working!";
    }
}
