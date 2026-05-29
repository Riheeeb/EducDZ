package com.educationonline.backend.dtos.AuthDTOs;

import java.util.List;

public class ErrorResponse {


    private boolean success;
    private String message;
    private String error;
    private List<String> errors;

    public ErrorResponse(boolean success, String message, String error, List<String> errors) {
        this.success = false;
        this.message = message;
        this.error = error;
        this.errors = errors;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public void setmessage(String message) {
        this.message = message;
    }
    public String getError() {
        return error;
    }
    public void setError(String error) {
        this.error = error;
    }
    public List<String> getErrors() {
        return errors;
    }

}
