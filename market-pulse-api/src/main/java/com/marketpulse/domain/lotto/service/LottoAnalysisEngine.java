package com.marketpulse.domain.lotto.service;

import com.marketpulse.domain.lotto.vo.LottoResultVo;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * 5가지 전략 수식 계산 엔진
 * 입력: 최근 N회 당첨 결과 리스트
 * 출력: 전략별 풀(10개) + 추천 조합(3개)
 */
@Component
public class LottoAnalysisEngine {

    private static final int POOL_SIZE   = 10;
    private static final int COMBO_SIZE  = 3;
    private static final int[] ALL_NUMS  = IntStream.rangeClosed(1, 45).toArray();

    // ──────────────────────────────────────────────
    // 공통 통계 계산
    // ──────────────────────────────────────────────

    private int recent(List<LottoResultVo> draws, int n, int k) {
        return (int) draws.stream().limit(k)
                .filter(d -> contains(d.getNumbers(), n)).count();
    }

    private int prev10(List<LottoResultVo> draws, int n) {
        return (int) draws.stream().skip(10).limit(10)
                .filter(d -> contains(d.getNumbers(), n)).count();
    }

    private int absent(List<LottoResultVo> draws, int n) {
        for (int i = 0; i < draws.size(); i++) {
            if (contains(draws.get(i).getNumbers(), n)) return i;
        }
        return draws.size();
    }

    private boolean contains(int[] arr, int n) {
        for (int v : arr) if (v == n) return true;
        return false;
    }

    /** 전체 회차 기준 두 번호 동반 출현 횟수 */
    private double pairRate(List<LottoResultVo> draws, int a, int b) {
        long co = draws.stream()
                .filter(d -> contains(d.getNumbers(), a) && contains(d.getNumbers(), b))
                .count();
        return (double) co / draws.size();
    }

    private double recentPairRate30(List<LottoResultVo> draws, int a, int b) {
        List<LottoResultVo> recent30 = draws.stream().limit(30).collect(Collectors.toList());
        long co = recent30.stream()
                .filter(d -> contains(d.getNumbers(), a) && contains(d.getNumbers(), b))
                .count();
        return (double) co / recent30.size();
    }

    // min-max 정규화
    private double[] normalize(double[] raw) {
        double min = Arrays.stream(raw).min().orElse(0);
        double max = Arrays.stream(raw).max().orElse(1);
        if (max == min) return new double[46]; // 모두 0
        double[] norm = new double[raw.length];
        for (int i = 0; i < raw.length; i++) norm[i] = (raw[i] - min) / (max - min);
        return norm;
    }

    // ──────────────────────────────────────────────
    // 전략 1: 모멘텀 (HOT + RISING)
    // ──────────────────────────────────────────────

    public int[] momentum(List<LottoResultVo> draws) {
        double[] hot     = new double[46];
        double[] rising  = new double[46];

        for (int n : ALL_NUMS) {
            hot[n] = recent(draws, n, 10) * 0.5
                   + recent(draws, n, 30) * 0.3
                   + recent(draws, n, 100) * 0.2;
            rising[n] = recent(draws, n, 10) - prev10(draws, n);
        }

        double[] nHot    = normalize(hot);
        double[] nRising = normalize(rising);
        double[] score   = new double[46];
        for (int n : ALL_NUMS) score[n] = nHot[n] * 0.6 + nRising[n] * 0.4;

        return topN(score, POOL_SIZE);
    }

    // ──────────────────────────────────────────────
    // 전략 2: 잠수함 (COLD + FALLING)
    // ──────────────────────────────────────────────

    public int[] submarine(List<LottoResultVo> draws) {
        double[] cold    = new double[46];
        double[] falling = new double[46];

        for (int n : ALL_NUMS) {
            cold[n]    = Math.min(absent(draws, n), 30);
            falling[n] = Math.max(prev10(draws, n) - recent(draws, n, 10), 0);
        }

        double[] nCold    = normalize(cold);
        double[] nFalling = normalize(falling);
        double[] score    = new double[46];
        for (int n : ALL_NUMS) score[n] = nCold[n] * 0.6 + nFalling[n] * 0.4;

        return topN(score, POOL_SIZE);
    }

    // ──────────────────────────────────────────────
    // 전략 3: 관계망 (동반 + 연속)
    // ──────────────────────────────────────────────

    public int[] network(List<LottoResultVo> draws) {
        double[] compRaw  = new double[46];
        double[] consecRaw = new double[46];

        for (int n : ALL_NUMS) {
            double pairSum = 0, recentPairSum = 0;
            for (int x : ALL_NUMS) {
                if (x == n) continue;
                pairSum       += pairRate(draws, n, x);
                recentPairSum += recentPairRate30(draws, n, x);
            }
            compRaw[n] = pairSum * 0.6 + recentPairSum * 0.4;

            int prev = (n > 1)  ? recent(draws, n - 1, 30) : 0;
            int next = (n < 45) ? recent(draws, n + 1, 30) : 0;
            consecRaw[n] = prev + next;
        }

        double[] nComp   = normalize(compRaw);
        double[] nConsec = normalize(consecRaw);
        double[] score   = new double[46];
        for (int n : ALL_NUMS) score[n] = nComp[n] * 0.7 + nConsec[n] * 0.3;

        return topN(score, POOL_SIZE);
    }

    // ──────────────────────────────────────────────
    // 전략 4: 위치 패턴 (끝수 + 구간)
    // ──────────────────────────────────────────────

    public int[] pattern(List<LottoResultVo> draws) {
        // 끝수별 최근 30회 출현 합계
        int[] digitCount = new int[10];
        draws.stream().limit(30).forEach(d -> {
            for (int n : d.getNumbers()) digitCount[n % 10]++;
        });

        // 구간별 최근 30회 출현 합계 (구간: 0=1~10, 1=11~20, 2=21~30, 3=31~40, 4=41~45)
        int[] sectionCount = new int[5];
        draws.stream().limit(30).forEach(d -> {
            for (int n : d.getNumbers()) sectionCount[sectionOf(n)]++;
        });

        double[] digitScore   = new double[46];
        double[] sectionScore = new double[46];
        for (int n : ALL_NUMS) {
            digitScore[n]   = digitCount[n % 10];
            sectionScore[n] = sectionCount[sectionOf(n)];
        }

        double[] nDigit   = normalize(digitScore);
        double[] nSection = normalize(sectionScore);
        double[] score    = new double[46];
        for (int n : ALL_NUMS) score[n] = nDigit[n] * 0.5 + nSection[n] * 0.5;

        return topN(score, POOL_SIZE);
    }

    private int sectionOf(int n) {
        if (n <= 10) return 0;
        if (n <= 20) return 1;
        if (n <= 30) return 2;
        if (n <= 40) return 3;
        return 4;
    }

    // ──────────────────────────────────────────────
    // 전략 5: AI 스마트픽
    // ──────────────────────────────────────────────

    public int[] aiPick(List<LottoResultVo> draws,
                        int[] momentumPool, int[] submarinePool,
                        int[] networkPool,  int[] patternPool) {

        double[] hot     = new double[46];
        double[] cold    = new double[46];
        double[] compRaw = new double[46];
        double[] digit   = new double[46];
        double[] section = new double[46];
        double[] consec  = new double[46];
        double[] core    = new double[46];

        int[] digitCount   = new int[10];
        int[] sectionCount = new int[5];
        draws.stream().limit(30).forEach(d -> {
            for (int n : d.getNumbers()) {
                digitCount[n % 10]++;
                sectionCount[sectionOf(n)]++;
            }
        });

        for (int n : ALL_NUMS) {
            hot[n] = recent(draws, n, 10) * 0.5
                   + recent(draws, n, 30) * 0.3
                   + recent(draws, n, 100) * 0.2;
            cold[n] = Math.min(absent(draws, n), 30);

            double pairSum = 0, recentPairSum = 0;
            for (int x : ALL_NUMS) {
                if (x == n) continue;
                pairSum       += pairRate(draws, n, x);
                recentPairSum += recentPairRate30(draws, n, x);
            }
            compRaw[n] = pairSum * 0.6 + recentPairSum * 0.4;

            digit[n]   = digitCount[n % 10];
            section[n] = sectionCount[sectionOf(n)];

            int prev = (n > 1)  ? recent(draws, n - 1, 30) : 0;
            int next = (n < 45) ? recent(draws, n + 1, 30) : 0;
            consec[n] = prev + next;

            int included = 0;
            if (contains(momentumPool, n)) included++;
            if (contains(submarinePool, n)) included++;
            if (contains(networkPool, n)) included++;
            if (contains(patternPool, n)) included++;
            core[n] = (double) included / 4.0;
        }

        double[] nHot     = normalize(hot);
        double[] nCold    = normalize(cold);
        double[] nComp    = normalize(compRaw);
        double[] nDigit   = normalize(digit);
        double[] nSection = normalize(section);
        double[] nConsec  = normalize(consec);

        double[] score = new double[46];
        for (int n : ALL_NUMS) {
            score[n] = nHot[n]     * 0.20
                     + nCold[n]    * 0.15
                     + nComp[n]    * 0.20
                     + nDigit[n]   * 0.10
                     + nSection[n] * 0.10
                     + nConsec[n]  * 0.10
                     + core[n]     * 0.15;
        }

        return topN(score, POOL_SIZE);
    }

    // ──────────────────────────────────────────────
    // 조합 생성
    // ──────────────────────────────────────────────

    /**
     * 풀에서 C(10,6)=210 조합 생성 → 필터 적용 → 점수 상위 COMBO_SIZE개 반환
     * AI_PICK 전략은 역배 보너스 적용
     */
    public List<List<Integer>> generateCombos(int[] pool, double[] scoreRef, boolean applyUnpopular) {
        List<int[]> candidates = new ArrayList<>();
        int len = pool.length;

        // C(10,6) 전체 조합
        for (int a = 0; a < len - 5; a++)
        for (int b = a+1; b < len - 4; b++)
        for (int c = b+1; c < len - 3; c++)
        for (int d = c+1; d < len - 2; d++)
        for (int e = d+1; e < len - 1; e++)
        for (int f = e+1; f < len; f++) {
            int[] combo = {pool[a], pool[b], pool[c], pool[d], pool[e], pool[f]};
            if (passFilter(combo)) candidates.add(combo);
        }

        if (candidates.isEmpty()) {
            // 필터 조건 완화해서 재시도 (구간만 체크)
            for (int a = 0; a < len - 5; a++)
            for (int b = a+1; b < len - 4; b++)
            for (int c = b+1; c < len - 3; c++)
            for (int d = c+1; d < len - 2; d++)
            for (int e = d+1; e < len - 1; e++)
            for (int f = e+1; f < len; f++) {
                candidates.add(new int[]{pool[a], pool[b], pool[c], pool[d], pool[e], pool[f]});
            }
        }

        return candidates.stream()
                .sorted(Comparator.comparingDouble(
                        (int[] combo) -> -comboScore(combo, scoreRef, applyUnpopular)))
                .limit(COMBO_SIZE)
                .map(combo -> {
                    List<Integer> list = new ArrayList<>();
                    for (int v : combo) list.add(v);
                    Collections.sort(list);
                    return list;
                })
                .collect(Collectors.toList());
    }

    private boolean passFilter(int[] combo) {
        int sum  = 0, odd = 0, consecutive = 0;
        Set<Integer> sections = new HashSet<>();
        Arrays.sort(combo);

        for (int v : combo) {
            sum += v;
            if (v % 2 != 0) odd++;
            sections.add(sectionOf(v));
        }
        for (int i = 0; i < combo.length - 1; i++) {
            if (combo[i+1] - combo[i] == 1) consecutive++;
        }

        return sum >= 80 && sum <= 170
            && Math.abs(odd - (6 - odd)) <= 2
            && sections.size() >= 3
            && consecutive <= 2;
    }

    private double comboScore(int[] combo, double[] scoreRef, boolean applyUnpopular) {
        double s = Arrays.stream(combo).mapToDouble(n -> scoreRef[n]).average().orElse(0);
        if (applyUnpopular) {
            long over31 = Arrays.stream(combo).filter(n -> n > 31).count();
            s += over31 * 0.05;
        }
        return s;
    }

    // ──────────────────────────────────────────────
    // 유틸
    // ──────────────────────────────────────────────

    private int[] topN(double[] score, int n) {
        return IntStream.rangeClosed(1, 45)
                .boxed()
                .sorted(Comparator.comparingDouble((Integer i) -> score[i]).reversed())
                .limit(n)
                .mapToInt(Integer::intValue)
                .toArray();
    }

    public int calcHitCount(int[] pool, int[] winning) {
        return (int) Arrays.stream(winning).filter(w -> contains(pool, w)).count();
    }
}
