package com.educationonline.backend.dtos.AuthDTOs;
public class SuccessResponse<T> {

    private boolean success;
    private String message;
    private T data;

    //T is a GENERIC TYPE
    public SuccessResponse(boolean success, String message, T data) {
        this.success = true;
        this.message = message;
        this.data = data;
    }
    public boolean isSuccess() {
        return success;
    }
    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }



}
