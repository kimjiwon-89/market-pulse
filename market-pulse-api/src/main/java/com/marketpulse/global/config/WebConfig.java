package com.marketpulse.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 *  WebConfig
 *      api 기본 Web 설정
 *
 *
 */
@Configuration
@EnableConfigurationProperties(WebConfig.AppProperties.class)
public class WebConfig {

    private final AppProperties properties;

    public WebConfig(AppProperties properties) {
        this.properties = properties;
    }

    /**
     * CORS 필터 설정
     *
     * - 프론트엔드(web) 서버에서 api 서버 접근 허용
     * - yml에서 허용 도메인 읽음
     */
    @Bean
    public CorsFilter corsFilter() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(properties.getCors().getAllowedOrigins());
        config.setAllowedMethods(properties.getCors().getAllowedMethods());
        config.setAllowedHeaders(properties.getCors().getAllowedHeaders());
        config.setAllowCredentials(properties.getCors().isAllowCredentials());

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }

    /**
     * RestTemplate 설정
     *
     * - 외부 API 호출 전용
     * - timeout을 반드시 yml 기반으로 설정
     */
    @Bean
    public RestTemplate restTemplate() {

        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(properties.getHttp().getConnectTimeout());
        factory.setReadTimeout(properties.getHttp().getReadTimeout());

        return new RestTemplate(factory);
    }

    /**
     * application.yml 값을 바인딩하는 내부 클래스
     *
     * prefix = app
     */
    @Getter
    @Setter
    @ConfigurationProperties(prefix = "app")
    public static class AppProperties {

        private Cors cors;
        private Http http;

        @Getter
        @Setter
        public static class Cors {
            private List<String> allowedOrigins;
            private List<String> allowedMethods;
            private List<String> allowedHeaders;
            private boolean allowCredentials;
        }

        @Getter
        @Setter
        public static class Http {
            private int connectTimeout;
            private int readTimeout;
        }
    }
}
