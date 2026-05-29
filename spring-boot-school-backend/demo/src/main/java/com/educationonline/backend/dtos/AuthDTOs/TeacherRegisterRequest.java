package com.educationonline.backend.dtos.AuthDTOs;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;

public class TeacherRegisterRequest {

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
   
    @NotNull
    private Long teacherSubjectId;

    public TeacherRegisterRequest() {
    }

    public TeacherRegisterRequest(String name, String email, String password, String confirmPassword,
             Long teacherSubjectId) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.confirmPassword = confirmPassword;
       
        this.teacherSubjectId = teacherSubjectId;
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

  

    public Long getTeacherSubjectId() {
        return teacherSubjectId;
    }

    public void setTeacherSubjectId(Long teacherSubjectId) {
        this.teacherSubjectId = teacherSubjectId;
    }

    

    

}
