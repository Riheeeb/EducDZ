package com.educationonline.backend.Config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalStateException(IllegalStateException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(errorBody("CONFLICT", friendlyMessage(ex.getMessage())));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errorBody("BAD_REQUEST", friendlyMessage(ex.getMessage())));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody("SERVER_ERROR", "Something went wrong. Please try again."));
    }

    private Map<String, Object> errorBody(String error, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("error", error);
        body.put("message", message);
        return body;
    }

    private String friendlyMessage(String message) {
        if ("Student has already completed this quiz with 100% score.".equals(message)) {
            return "You have already completed this quiz.";
        }
        if ("Student already has an in-progress attempt on this quiz.".equals(message)) {
            return "You already have a quiz attempt in progress.";
        }
        if ("This attempt has already been submitted.".equals(message)) {
            return "This quiz attempt has already been submitted.";
        }
        return message != null && !message.isBlank()
                ? message
                : "Request could not be completed.";
    }
}
