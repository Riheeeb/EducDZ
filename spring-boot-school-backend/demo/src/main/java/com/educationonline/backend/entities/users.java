package com.educationonline.backend.entities;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class users {
  
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column( nullable = false, length = 150 )
    private String name;

    @NotBlank
    @Email
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column( nullable = false, length = 50 )
    private AccountType accountType;

    @Column(name ="isEnabled", nullable = false , columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean enabled = true;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @OneToOne(mappedBy="userT" , cascade = CascadeType.ALL)
    private teachers teacher;

    @JsonIgnore
    @OneToOne(mappedBy = "userS" , cascade = CascadeType.ALL)
    private students student;

    public boolean isEnabled() {
        return enabled;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
