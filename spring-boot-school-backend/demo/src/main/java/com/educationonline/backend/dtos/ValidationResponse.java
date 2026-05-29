package com.educationonline.backend.dtos;

public class ValidationResponse {


    private boolean isValid;
    private String message;
    private String error;
    private int code;

    public ValidationResponse() {
    }

    public ValidationResponse(boolean isValid, String message , String error , int code) {
        this.isValid = isValid;
        this.message = message;
        this.error = error;
        this.code = code;
    }

    public boolean isValid() {
        return isValid;
    }

    public void setValid(boolean isValid) {
        this.isValid = isValid;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getError() {
        return error;
    }
    public void setError(String error) {
        this.error = error;
    }
    public int getCode() {
        return code;
    }
    public void setCode(int code) {
        this.code = code;
    }



}

