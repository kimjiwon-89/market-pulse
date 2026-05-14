# AI 로또 번호 분석 시스템 기획

## 프로젝트 방향

단순 번호 추천기가 아니라:

- 회차별 번호 흐름 분석
- 주제별 핵심 번호 Pool 제공
- 실제 결과 비교
- 전략별 성능 분석

을 제공하는 형태의 "로또 분석 연구소" 컨셉.

핵심은:

- 예측
- 당첨 보장

이 아니라

- 통계 분석
- 흐름 관찰
- 번호 연구
- 사용자 참여형 조합 생성

에 초점을 둠.

---

# 메인 컨셉

## 기존 방식

```text
3 11 17 28 34 42
```

단일 번호 추천.

---

## 변경 방식

주제별 핵심 번호 Pool 제공.

예:

### HOT 번호 Pool

```text
3 7 11 17 28 34 35 42 44 45
```

### COLD 번호 Pool

```text
5 9 13 22 31 37 39 40 41 43
```

그리고 이 Pool 기반으로 추천 조합 생성.

예:

```text
3 11 17 28 34 42
7 17 28 35 42 44
3 7 11 35 42 45
```

사용자가 직접 선택 및 조합 가능하도록 구성.

---

# 서비스 핵심 포인트

## 핵심 번호 Pool

사용자는 단일 조합보다:

- 여러 분석에서 공통 등장하는 번호
- 최근 강세 번호
- 장기 미출현 번호

등을 참고하여 직접 조합을 구성.

---

# 메인 화면 구성

## 상단

### 회차 선택

```text
1157회 (2026-05-09)
```

또는 날짜 선택.

최신 회차 기본 진입.

---

## 상단 요약 카드

```text
1157회 AI 분석 리포트

실제 당첨 번호
3 17 22 28 35 42

보너스
11
```

---

# 핵심 번호 영역

## CORE 번호

여러 분석에서 공통 등장한 번호.

예:

```text
17
42
28
```

---

# 주제별 분석 영역

## HOT 번호 분석

최근 출현률 상승 번호.

### 예시 Pool

```text
3 7 11 17 28 34 35 42 44 45
```

### 추천 조합

```text
3 11 17 28 34 42
7 17 28 35 42 44
```

---

## COLD 번호 분석

장기 미출현 번호 기반.

### 예시 Pool

```text
5 9 13 22 31 37 39 40 41 43
```

---

## 밸런스 분석

실제 당첨 평균 패턴 기반.

분석 요소:

- 홀짝 비율
- 구간 분포
- 합계 평균
- 연속번호 제한

---

## 연속번호 분석

최근 연속번호 출현 흐름 기반.

예:

```text
12 13
33 34
```

---

## 동반번호 분석

같이 자주 등장하는 번호 분석.

예:

```text
7 ↔ 21
3 ↔ 11
```

---

## AI 종합 분석

전체 통계를 가중치 기반으로 합산.

---

# 회차별 결과 비교

## 예상 vs 실제 결과

예:

```text
HOT 추천 번호
7 17 28 35 42

실제 당첨
17 28 35 42

4개 적중
```

---

# 전략별 성능 비교

예:

| 전략 | 평균 적중 |
|------|------------|
| HOT | 2.1 |
| COLD | 1.7 |
| AI 종합 | 2.8 |

---

# 번호 상태 시스템

## 상태 종류

| 상태 | 의미 |
|------|------|
| HOT | 최근 상승 |
| COLD | 장기 미출현 |
| CORE | 여러 분석 공통 |
| RISING | 급상승 |
| FALLING | 하락세 |

---

# 흐름 분석

회차가 쌓일수록:

- 번호 흐름
- 전략 성능
- 공통 번호 변화
- 최근 강세 구간

등이 변화.

예:

```text
17번
4주 연속 CORE 유지
```

```text
42번
HOT Pool 제외
```

---

# 사용자 참여 기능

## 번호 클릭 선택

사용자가 Pool 번호를 클릭하여 직접 조합 생성.

예:

```text
17 선택
42 선택
28 선택
```

---

## 사용자 조합 생성

```text
7 17 28 31 35 42
```

---

# 추천 조합 생성 규칙

## 기본 조건

### 홀짝 비율

- 3:3 우선
- 최대 편차 제한

---

### 합계 제한

```text
80 ~ 170
```

---

### 구간 분포

```text
1~10
11~20
21~30
31~40
41~45
```

각 구간 균형 반영.

---

### 연속번호 제한

최대 2개.

---

# 추천 주제 목록

| 주제 | 설명 |
|------|------|
| HOT | 최근 강세 번호 |
| COLD | 장기 미출현 번호 |
| 밸런스 | 평균 당첨 패턴 기반 |
| 연속번호 | 연속번호 흐름 기반 |
| 동반번호 | 같이 등장하는 번호 |
| 끝수 분석 | 최근 강세 끝수 |
| 구간 분석 | 강세 번호대 분석 |
| 역배 분석 | 사람들이 덜 고를 가능성 |
| AI 종합 | 전체 통계 기반 종합 |

---

# 회차 종료 후 처리

## 배치 흐름

```text
1. 회차 결과 저장
2. 통계 재계산
3. 주제별 Pool 생성
4. 추천 조합 생성
5. 실제 결과 비교
6. 전략 성능 계산
7. 흐름 분석 생성
```

---

# DB 구조

## LOTTO_RESULT

```text
회차별 실제 당첨 번호
```

---

## LOTTO_ANALYSIS_POOL

```text
회차별 주제별 핵심 번호 Pool 저장
```

---

## LOTTO_RECOMMEND_COMBINATION

```text
Pool 기반 추천 조합 저장
```

---

## LOTTO_ANALYSIS_RESULT

```text
추천 결과 적중 분석 저장
```

---

# 핵심 UX 방향

이 서비스는:

- 번호 예측 서비스
- 당첨 보장 서비스

가 아니라

- 번호 흐름 분석
- 통계 연구
- 사용자 참여형 조합 생성

컨셉으로 운영.

---

# 핵심 차별점

## 단순 추천 X

사용자가:

- Pool 참고
- 직접 선택
- 전략 비교
- 흐름 관찰

을 하도록 설계.

---

# 최종 컨셉

```text
AI 로또 분석 연구소
```

또는

```text
회차별 번호 흐름 분석 리포트
```

느낌으로 구성.


---

# 주제별 수학 / 통계 계산식

아래 계산식은 각 주제별 번호 Pool을 만들기 위한 점수 기준이다.

기본 대상 번호는 1부터 45까지이며, 각 번호 n에 대해 점수를 계산한 뒤 상위 번호를 Pool로 선정한다.

---

## 공통 기호 정의

```text
n = 대상 번호
r = 회차
R = 전체 회차 수
Recent10 = 최근 10회
Recent30 = 최근 30회
Recent100 = 최근 100회
Count(n) = 번호 n의 전체 출현 횟수
RecentCountK(n) = 최근 K회 동안 번호 n의 출현 횟수
AbsentRounds(n) = 번호 n이 마지막으로 출현한 이후 지나간 회차 수
TotalRounds = 전체 분석 회차 수
```

---

# 1. HOT 번호 분석

최근 회차에서 자주 나온 번호를 우선 선정한다.

## 계산식

```text
HotScore(n) = RecentCount10(n) * 0.5
            + RecentCount30(n) * 0.3
            + RecentCount100(n) * 0.2
```

## 의미

최근 10회에 더 높은 가중치를 부여한다.

최근에 자주 등장한 번호일수록 높은 점수를 받는다.

## Pool 선정

```text
HotScore 상위 10개 번호
```

---

# 2. COLD 번호 분석

오랫동안 나오지 않은 번호를 우선 선정한다.

## 계산식

```text
ColdScore(n) = AbsentRounds(n)
```

## 보정식

너무 오래 나오지 않은 번호만 과도하게 몰리는 것을 막기 위해 상한을 둘 수 있다.

```text
ColdScore(n) = min(AbsentRounds(n), 30)
```

## 의미

마지막 출현 이후 오래 지난 번호일수록 높은 점수를 받는다.

## Pool 선정

```text
ColdScore 상위 10개 번호
```

---

# 3. 밸런스 분석

실제 당첨 조합의 평균적인 구조에 가까운 번호 조합을 만든다.

밸런스 분석은 번호 하나보다 조합 단위 점수에 가깝다.

## 홀짝 점수

```text
OddEvenScore(combo) = 1 - abs(OddCount - EvenCount) / 6
```

## 합계 점수

```text
SumScore(combo) = 1 - abs(Sum(combo) - AvgWinningSum) / AvgWinningSum
```

## 구간 점수

구간 기준:

```text
1~10
11~20
21~30
31~40
41~45
```

```text
SectionScore(combo) = UsedSectionCount / 5
```

## 최종 밸런스 점수

```text
BalanceScore(combo) = OddEvenScore * 0.4
                    + SumScore * 0.3
                    + SectionScore * 0.3
```

## 의미

홀짝, 합계, 구간 분포가 과거 당첨 조합 평균에 가까울수록 높은 점수를 받는다.

---

# 4. 연속번호 분석

최근 당첨 조합에서 연속번호가 자주 등장했는지 분석한다.

## 연속번호 출현율

```text
ConsecutiveRate = ConsecutiveRounds / TotalRounds
```

## 특정 번호의 연속 후보 점수

번호 n 기준으로 n-1 또는 n+1이 최근 자주 등장했는지 본다.

```text
ConsecutiveScore(n) = RecentCount30(n - 1) + RecentCount30(n + 1)
```

단, 번호 범위는 1~45로 제한한다.

## 의미

주변 번호와 함께 연속 조합을 만들 가능성이 있는 번호를 선정한다.

## Pool 선정

```text
ConsecutiveScore 상위 번호
```

---

# 5. 동반번호 분석

같이 자주 등장한 번호 쌍을 분석한다.

## Pair 출현 점수

```text
PairScore(a, b) = CoOccurrence(a, b) / TotalRounds
```

## 번호별 Pair 점수

번호 n이 다른 번호들과 얼마나 자주 같이 나왔는지 합산한다.

```text
NumberPairScore(n) = Sum(PairScore(n, x))
```

단, x는 n을 제외한 1~45 번호다.

## 최근 Pair 보정

```text
RecentPairScore(n) = Sum(RecentCoOccurrence30(n, x))
```

## 최종 동반번호 점수

```text
CompanionScore(n) = NumberPairScore(n) * 0.6
                  + RecentPairScore(n) * 0.4
```

## 의미

다른 번호들과 같이 등장한 이력이 많은 번호를 우선 선정한다.

---

# 6. 끝수 분석

번호의 마지막 자리 숫자 흐름을 분석한다.

예:

```text
7, 17, 27, 37
```

은 모두 끝수 7이다.

## 끝수 계산

```text
LastDigit(n) = n % 10
```

## 끝수 점수

```text
LastDigitScore(d) = RecentLastDigitCount30(d)
```

## 번호별 끝수 점수

```text
NumberLastDigitScore(n) = LastDigitScore(LastDigit(n))
```

## 의미

최근 강세인 끝수를 가진 번호가 높은 점수를 받는다.

---

# 7. 구간 분석

최근 강세인 번호대를 분석한다.

## 구간 정의

```text
Section1 = 1~10
Section2 = 11~20
Section3 = 21~30
Section4 = 31~40
Section5 = 41~45
```

## 구간 점수

```text
SectionScore(s) = RecentSectionCount30(s) / TotalNumbersInRecent30
```

## 번호별 구간 점수

```text
NumberSectionScore(n) = SectionScore(Section(n))
```

## 의미

최근 자주 나온 구간에 속한 번호를 우선 선정한다.

---

# 8. 역배 분석

사람들이 흔히 고를 가능성이 낮은 번호 조합을 만든다.

로또 자체 확률은 동일하지만, 당첨금 분산 관점에서 사람이 덜 고를 만한 조합을 참고하는 컨셉이다.

## 생일 번호 회피 점수

1~31 번호가 적을수록 높은 점수를 준다.

```text
BirthdayAvoidScore(combo) = Count(numbers > 31) / 6
```

## 패턴 회피 점수

너무 예쁜 패턴을 피한다.

예:

```text
1 2 3 4 5 6
10 20 30 40 41 42
7 17 27 37 44 45
```

```text
PatternAvoidScore(combo) = 1 - PatternPenalty(combo)
```

## 최종 역배 점수

```text
UnpopularScore(combo) = BirthdayAvoidScore * 0.5
                      + PatternAvoidScore * 0.5
```

## 의미

사람들이 많이 선택할 법한 조합을 피하는 방향이다.

---

# 9. AI 종합 분석

여러 분석 점수를 합산하여 종합 점수를 만든다.

번호 단위 종합 점수:

```text
AIScore(n) = HotScore(n) * 0.25
           + ColdScore(n) * 0.15
           + CompanionScore(n) * 0.2
           + NumberLastDigitScore(n) * 0.1
           + NumberSectionScore(n) * 0.1
           + ConsecutiveScore(n) * 0.1
           + CoreScore(n) * 0.1
```

## 의미

특정 통계 하나에 치우치지 않고 여러 관점에서 반복적으로 등장하는 번호를 우선 선정한다.

## Pool 선정

```text
AIScore 상위 10개 번호
```

---

# 10. CORE 번호 분석

여러 주제 Pool에 중복 등장한 번호를 핵심 번호로 본다.

## 계산식

```text
CoreScore(n) = IncludedThemeCount(n) / TotalThemeCount
```

예:

```text
17번이 HOT, AI종합, 동반번호, 구간분석에 포함됨
전체 주제 8개 중 4개 포함
CoreScore = 4 / 8 = 0.5
```

## 의미

여러 분석 관점에서 동시에 선택된 번호일수록 핵심 번호로 본다.

---

# 11. RISING 번호 분석

최근에 점수가 빠르게 상승한 번호를 찾는다.

## 계산식

```text
RisingScore(n) = RecentCount10(n) - PreviousCount10(n)
```

PreviousCount10은 최근 10회 바로 이전의 10회 구간이다.

예:

```text
최근 10회 출현 3회
이전 10회 출현 1회
RisingScore = 2
```

## 의미

최근 들어 갑자기 자주 등장하기 시작한 번호를 찾는다.

---

# 12. FALLING 번호 분석

최근 흐름이 약해진 번호를 찾는다.

## 계산식

```text
FallingScore(n) = PreviousCount10(n) - RecentCount10(n)
```

## 의미

과거에는 자주 나왔지만 최근에는 줄어든 번호를 분석한다.

추천 Pool보다는 참고 정보나 제외 후보로 활용하기 좋다.

---

# 조합 생성 최종 점수

각 주제별 Pool에서 6개 조합을 만들 때 사용하는 조합 점수다.

```text
ComboScore(combo) = NumberScoreAverage(combo) * 0.4
                  + BalanceScore(combo) * 0.3
                  + UnpopularScore(combo) * 0.1
                  + PairComboScore(combo) * 0.2
```

## 번호 평균 점수

```text
NumberScoreAverage(combo) = Sum(Score(n)) / 6
```

## 조합 Pair 점수

조합 안에 있는 모든 번호 쌍의 동반 출현 점수 합산.

```text
PairComboScore(combo) = Sum(PairScore(a, b))
```

---

# 조합 필터링 조건

생성된 조합 중 아래 조건을 통과한 조합만 노출한다.

## 합계 조건

```text
80 <= Sum(combo) <= 170
```

## 홀짝 조건

```text
abs(OddCount - EvenCount) <= 2
```

## 연속번호 조건

```text
ConsecutiveCount <= 2
```

## 구간 조건

```text
UsedSectionCount >= 3
```

## 중복 끝수 제한

```text
SameLastDigitCount <= 3
```

---

# 최종 처리 흐름

```text
1. 실제 당첨 데이터 조회
2. 번호별 기본 통계 계산
3. 주제별 점수 계산
4. 주제별 상위 10개 번호 Pool 생성
5. Pool 기반 6개 조합 생성
6. 조합 필터링
7. 조합 점수 계산
8. 상위 조합 노출
9. 회차 종료 후 실제 번호와 비교
10. 전략별 성능 누적
```

---

# 개발 시 추천 방식

처음부터 복잡한 AI 모델을 붙이기보다 아래 순서로 구현한다.

```text
1단계: HOT, COLD, 밸런스, CORE
2단계: 동반번호, 구간, 끝수
3단계: AI 종합 점수
4단계: RISING, FALLING, 역배
5단계: 백테스트 및 전략 성능 분석
```

이렇게 가면 초기 구현 난이도를 낮추면서도 화면상으로는 충분히 분석 서비스처럼 보일 수 있다.
