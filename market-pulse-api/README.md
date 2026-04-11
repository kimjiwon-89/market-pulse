# Market-Pulse API 개발 가이드

## 프로젝트 아키텍처

본 프로젝트는 **Layered Architecture(계층형 구조)** 를 따른다.

```
Controller → Service → Client / Mapper → External API / DB
```
## 계층 역할

| 계층 | 역할 |
|------|------|
| Controller | API 요청 및 응답 처리 |
| Service | 비즈니스 로직 처리 |
| Client | 외부 API 호출 |
| Mapper | DB 접근 |
| DTO | API 데이터 전달 객체 |
| VO | DB 데이터 구조 객체 |

---


# 계층별 개발 규칙

## Controller 규칙

### 역할

- Request 받기
- Service 호출
- Response 반환

### Controller에서 하면 안되는 것

```
비즈니스 로직 작성
DB 직접 호출
외부 API 호출
JSON 파싱 처리
```

### 예시

```java
@GetMapping("/foreign-trade")
public ApiResponse<List<ForeignTradeItemDto>> foreignTrade(
        ForeignTradeRequest request
){

    List<ForeignTradeItemDto> result =
            stockService.getForeignTrade(request);

    return ApiResponse.success(result);
}
```

---

## Service 규칙

### 역할

- 비즈니스 로직 처리
- 외부 API 호출
- DB 호출
- DTO 변환

### 예시

```java
public List<ForeignTradeItemDto> getForeignTrade(
        ForeignTradeRequest request
){

    KisResponse<List<ForeignTradeItemDto>> response =
            kisApiClient.callGet(...);

    response.validate();

    return response.getOutput();
}
```

---

## Mapper 규칙

### 역할

DB CRUD만 수행한다.

### 예시

```java
List<StockVo> selectStockList();
```

### 금지 사항

```
DTO 반환 금지
비즈니스 로직 금지
```

---

# DTO vs VO 구분

## VO

### 목적

DB 구조 표현

### 예시

```
StockVo
UserVo
```

### 규칙

```
DB 컬럼 그대로 사용
Mapper에서만 사용
Controller 사용 금지
```

---

## DTO

### 목적

API 데이터 전달

### 예시

```
ForeignTradeRequest
ForeignTradeResponseDto
ForeignTradeItemDto
StockDto
```

### 규칙

```
Controller 사용 가능
Service 사용 가능
VO 변환 가능
```

---

# 데이터 흐름

## 정석 구조

```
Controller
 ↓ DTO
Service
 ↓
External API / Mapper
 ↓
VO / ExternalResponse
 ↓ 변환
DTO
 ↓
Controller
```

## 핵심 원칙

```
Controller는 DTO만 사용
DB는 VO만 사용
```

---

# ApiResponse 규칙

Controller 응답은 반드시 ApiResponse 사용한다.

## 구조

```java
public class ApiResponse<T>{

    private boolean success;

    private T data;

    private String message;

}
```

## 사용 예시

```
ApiResponse<List<StockDto>>
ApiResponse<StockDto>
ApiResponse<Void>
```

---

# 개발 핵심 규칙

다음 5가지 규칙은 반드시 지킨다.

1 Controller는 DTO만 사용

2 DB는 VO만 사용

3 외부 API는 Service에서 처리

4 Controller에서 로직 작성 금지

5 ApiResponse로 응답 통일

---

# 금지 사항

## Controller

```
RestTemplate 호출 금지
Mapper 직접 호출 금지
비즈니스 로직 금지
```

## Service

```
HttpServletRequest 사용 금지
ResponseEntity 반환 금지
```

## Mapper

```
DTO 반환 금지
비즈니스 로직 금지
```

---
