package com.marketpulse.domain.user.service;

import com.marketpulse.domain.user.dto.UserChangePasswordRequest;
import com.marketpulse.domain.user.dto.UserCreateRequest;
import com.marketpulse.domain.user.dto.UserResponseDto;
import com.marketpulse.domain.user.mapper.UserMapper;
import com.marketpulse.domain.user.vo.UserVo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponseDto> getAll() {
        return userMapper.findAll().stream()
                .map(UserResponseDto::from)
                .toList();
    }

    public UserResponseDto create(UserCreateRequest req) {
        if (userMapper.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다: " + req.getUsername());
        }
        UserVo user = new UserVo();
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole() != null ? req.getRole() : "USER");
        userMapper.insert(user);
        return UserResponseDto.from(userMapper.findByUsername(req.getUsername()));
    }

    public void delete(Long id, String requestingUsername) {
        UserVo target = userMapper.findAll().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
        if (target.getUsername().equals(requestingUsername)) {
            throw new IllegalArgumentException("자기 자신은 삭제할 수 없습니다");
        }
        userMapper.deleteById(id);
    }

    public void changePassword(Long id, UserChangePasswordRequest req) {
        userMapper.updatePassword(id, passwordEncoder.encode(req.getNewPassword()));
    }
}
