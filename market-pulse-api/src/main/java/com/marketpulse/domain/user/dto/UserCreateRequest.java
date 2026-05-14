package com.marketpulse.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserCreateRequest {
    private String username;
    private String password;
    private String role; // ADMIN | USER
}
