package com.marketpulse.global.config;

import com.marketpulse.global.auth.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           CorsConfigurationSource corsConfigurationSource,
                                           JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/memo/**", "/api/memo").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/lotto/analyze").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/lotto/collect").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/lotto/bulk-results").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/lotto/analyze-all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/lotto/result").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/lotto/combo").authenticated()
                .requestMatchers(HttpMethod.POST,   "/api/lotto/combo").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/lotto/combo/**").authenticated()
                .requestMatchers(HttpMethod.POST,   "/api/lotto/comment").authenticated()
                .requestMatchers(HttpMethod.POST,   "/api/lotto/comment/**").authenticated()
                .requestMatchers(HttpMethod.PATCH,  "/api/lotto/comment/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/lotto/comment/**").authenticated()
                .anyRequest().permitAll()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> {
                    res.setContentType("application/json;charset=UTF-8");
                    res.setStatus(401);
                    res.getWriter().write("{\"success\":false,\"data\":null,\"message\":\"로그인이 필요합니다\"}");
                })
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
