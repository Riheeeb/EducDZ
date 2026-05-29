package com.educationonline.backend.dtos.AuthDTOs;


import com.educationonline.backend.entities.StudentLevel;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class StudentRegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;
    @NotBlank(message = "Confirm Password is required")
    private String confirmPassword;


    
    private StudentLevel studentLevel;
   
    
   
    @NotNull(message = "Year is required")
    private Long yearId;

    private Long streamTypeId;

    
    private Long substreamId;

    public StudentRegisterRequest() {
    }
    public StudentRegisterRequest(String name, String email, String password, String confirmPassword,StudentLevel studentLevel , Long yearId, Long streamTypeId, Long substreamId) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.confirmPassword = confirmPassword;
        this.studentLevel = studentLevel;
       
        this.yearId = yearId;
        this.streamTypeId = streamTypeId;
        this.substreamId = substreamId;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public String getConfirmPassword() {
        return confirmPassword;
    }
    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }
    
   

    public Long getYearId() {
        return yearId;
    }
    public void setYearId(Long yearId) {
        this.yearId = yearId;
    }
   
    public Long getStreamTypeId() {
        return streamTypeId;
    }
    public void setStreamTypeId(Long streamTypeId) {
        this.streamTypeId = streamTypeId;
    }
    public Long getSubstreamId() {
        return substreamId;
    }
    public void setSubstreamId(Long substreamId) {
        this.substreamId = substreamId;
    }

    

   
    

}
