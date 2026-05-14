package com.marketpulse.global.auth;

import com.marketpulse.domain.user.mapper.UserMapper;
import com.marketpulse.domain.user.vo.UserVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InitialDataRunner implements ApplicationRunner {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.auth.username:admin}")
    private String adminUsername;

    @Value("${app.auth.password:market2026}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!userMapper.existsByUsername(adminUsername)) {
            UserVo admin = new UserVo();
            admin.setUsername(adminUsername);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            userMapper.insert(admin);
            log.info("초기 관리자 계정 생성: {}", adminUsername);
        }
    }
}
