package com.educationonline.backend.dtos.AuthDTOs;

import com.educationonline.backend.entities.AccountType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {

    private Long userId;
    private String email;
    private String name;
    private AccountType accountType;
}
