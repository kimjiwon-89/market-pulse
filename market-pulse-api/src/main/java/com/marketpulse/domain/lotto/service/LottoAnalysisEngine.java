package com.marketpulse.domain.lotto.service;

import com.marketpulse.domain.lotto.vo.LottoResultVo;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
public class LottoAnalysisEngine {

    private static final int POOL_SIZE  = 10;
    private static final int COMBO_SIZE = 3;
    private static final int[] ALL_NUMS = IntStream.rangeClosed(1, 45).toArray();

    // ──────────────────────────────────────────────
    // 기본 통계 헬퍼
    // ──────────────────────────────────────────────

    private boolean contains(int[] arr, int n) {
        for (int v : arr) if (v == n) return true;
        return false;
    }

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

    /**
     * 지수 감쇠 가중 빈도 — 최근 출현일수록 더 높은 가중치
     * WeightedFreq(n) = Σ 0.95^(latestDrawNo - drawNo_i)  (n 출현 회차)
     */
    private double weightedFreq(List<LottoResultVo> draws, int n) {
        if (draws.isEmpty()) return 0;
        int latest = draws.get(0).getDrawNo();
        return draws.stream()
                .filter(d -> contains(d.getNumbers(), n))
                .mapToDouble(d -> Math.pow(0.95, latest - d.getDrawNo()))
                .sum();
    }

    /**
     * 특정 index 범위 내 지수 감쇠 가중 빈도 (Rising 계산용)
     */
    private double weightedFreqRange(List<LottoResultVo> draws, int n, int fromIdx, int toIdx) {
        if (draws.isEmpty()) return 0;
        int latest = draws.get(0).getDrawNo();
        return draws.stream().skip(fromIdx).limit(toIdx - fromIdx)
                .filter(d -> contains(d.getNumbers(), n))
                .mapToDouble(d -> Math.pow(0.95, latest - d.getDrawNo()))
                .sum();
    }

    /**
     * 기대 주기 대비 현재 공백 비율
     * DueScore(n) = LastAbsent(n) / AvgInterval(n) — 1 이상이면 "나왔어야 할 번호"
     */
    private double dueScore(List<LottoResultVo> draws, int n) {
        List<Integer> indices = new ArrayList<>();
        for (int i = 0; i < draws.size(); i++) {
            if (contains(draws.get(i).getNumbers(), n)) indices.add(i);
        }
        if (indices.isEmpty()) return draws.size();
        if (indices.size() < 2) return indices.get(0);

        double sumInterval = 0;
        for (int i = 1; i < indices.size(); i++) {
            sumInterval += indices.get(i) - indices.get(i - 1);
        }
        double avgInterval = sumInterval / (indices.size() - 1);
        if (avgInterval <= 0) return 0;
        return indices.get(0) / avgInterval;
    }

    /** 전체 기간 동반 출현 비율 — 페어 관계는 장기 데이터가 안정적 */
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
        return (double) co / Math.max(recent30.size(), 1);
    }

    private double[] normalize(double[] raw) {
        double min = Arrays.stream(raw).min().orElse(0);
        double max = Arrays.stream(raw).max().orElse(1);
        if (max == min) return new double[raw.length];
        double[] norm = new double[raw.length];
        for (int i = 0; i < raw.length; i++) norm[i] = (raw[i] - min) / (max - min);
        return norm;
    }

    private int sectionOf(int n) {
        if (n <= 10) return 0;
        if (n <= 20) return 1;
        if (n <= 30) return 2;
        if (n <= 40) return 3;
        return 4;
    }

    // ──────────────────────────────────────────────
    // 전략 1: 모멘텀 (지수 감쇠 WeightedFreq + Rising)
    // ──────────────────────────────────────────────

    public int[] momentum(List<LottoResultVo> draws) {
        double[] wFreq  = new double[46];
        double[] rising = new double[46];

        for (int n : ALL_NUMS) {
            wFreq[n]  = weightedFreq(draws, n);
            double recent10 = weightedFreqRange(draws, n, 0, 10);
            double prev10   = weightedFreqRange(draws, n, 10, 20);
            rising[n] = recent10 - prev10;
        }

        double[] nFreq   = normalize(wFreq);
        double[] nRising = normalize(rising);
        double[] score   = new double[46];
        for (int n : ALL_NUMS) score[n] = nFreq[n] * 0.6 + nRising[n] * 0.4;

        return topN(score, POOL_SIZE);
    }

    // ──────────────────────────────────────────────
    // 전략 2: 잠수함 (Cold + Falling + DueScore)
    // ──────────────────────────────────────────────

    public int[] submarine(List<LottoResultVo> draws) {
        double[] cold    = new double[46];
        double[] falling = new double[46];
        double[] due     = new double[46];

        for (int n : ALL_NUMS) {
            cold[n]    = Math.min(absent(draws, n), 30);
            falling[n] = Math.max(prev10(draws, n) - recent(draws, n, 10), 0);
            due[n]     = dueScore(draws, n);
        }

        double[] nCold    = normalize(cold);
        double[] nFalling = normalize(falling);
        double[] nDue     = normalize(due);
        double[] score    = new double[46];
        for (int n : ALL_NUMS) score[n] = nCold[n] * 0.4 + nFalling[n] * 0.3 + nDue[n] * 0.3;

        return topN(score, POOL_SIZE);
    }

    // ──────────────────────────────────────────────
    // 전략 3: 관계망 (동반 + 연속)
    // ──────────────────────────────────────────────

    public int[] network(List<LottoResultVo> draws) {
        double[] compRaw   = new double[46];
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
        int[] digitCount   = new int[10];
        int[] sectionCount = new int[5];
        draws.stream().limit(30).forEach(d -> {
            for (int n : d.getNumbers()) {
                digitCount[n % 10]++;
                sectionCount[sectionOf(n)]++;
            }
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

    // ──────────────────────────────────────────────
    // 전략 5: AI 스마트픽 (앙상블 투표 보너스 추가)
    // ──────────────────────────────────────────────

    public int[] aiPick(List<LottoResultVo> draws,
                        int[] momentumPool, int[] submarinePool,
                        int[] networkPool,  int[] patternPool) {

        double[] hot     = new double[46];
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
            hot[n] = weightedFreq(draws, n);

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

            // SUBMARINE 제외 — 랜덤 이하 성적으로 앙상블 품질 저하 방지
            int voteCount = 0;
            if (contains(momentumPool, n)) voteCount++;
            if (contains(networkPool, n))  voteCount++;
            if (contains(patternPool, n))  voteCount++;
            core[n] = (double) voteCount / 3.0;  // 3개 전략 기준
        }

        double[] nHot     = normalize(hot);
        double[] nComp    = normalize(compRaw);
        double[] nDigit   = normalize(digit);
        double[] nSection = normalize(section);
        double[] nConsec  = normalize(consec);

        // MOMENTUM 성적이 가장 우수해 HOT 비중 상향, COLD 제거
        double[] baseScore = new double[46];
        for (int n : ALL_NUMS) {
            baseScore[n] = nHot[n]     * 0.35
                         + nComp[n]    * 0.25
                         + nDigit[n]   * 0.10
                         + nSection[n] * 0.10
                         + nConsec[n]  * 0.05
                         + core[n]     * 0.15;
        }

        // 앙상블 투표 보너스 (3개 전략 중 몇 개에 뽑혔나)
        double[] score = new double[46];
        for (int n : ALL_NUMS) {
            double ensembleBonus = core[n];  // 이미 0~1 범위
            score[n] = baseScore[n] * 0.7 + ensembleBonus * 0.3;
        }

        return topN(score, POOL_SIZE);
    }

    // ──────────────────────────────────────────────
    // 조합 생성
    // ──────────────────────────────────────────────

    public List<List<Integer>> generateCombos(int[] pool, double[] scoreRef, boolean applyUnpopular) {
        List<int[]> candidates = new ArrayList<>();
        int len = pool.length;

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
            // 강화 조건 통과 실패 시 완화 조건으로 재시도
            for (int a = 0; a < len - 5; a++)
            for (int b = a+1; b < len - 4; b++)
            for (int c = b+1; c < len - 3; c++)
            for (int d = c+1; d < len - 2; d++)
            for (int e = d+1; e < len - 1; e++)
            for (int f = e+1; f < len; f++) {
                int[] combo = {pool[a], pool[b], pool[c], pool[d], pool[e], pool[f]};
                if (passFilterRelaxed(combo)) candidates.add(combo);
            }
        }

        if (candidates.isEmpty()) {
            // 최후 폴백: 필터 없이 전체 추가
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

    /** 역대 당첨 통계 기반 강화된 필터 (100~175 합계, 4구간 이상, 3연속 금지) */
    private boolean passFilter(int[] combo) {
        int sum = 0, odd = 0;
        Set<Integer> sections = new HashSet<>();
        Arrays.sort(combo);

        for (int v : combo) {
            sum += v;
            if (v % 2 != 0) odd++;
            sections.add(sectionOf(v));
        }

        int maxRun = 1, curRun = 1;
        for (int i = 1; i < combo.length; i++) {
            if (combo[i] - combo[i-1] == 1) curRun++;
            else curRun = 1;
            if (curRun > maxRun) maxRun = curRun;
        }

        return sum >= 100 && sum <= 175
            && odd >= 2 && odd <= 4        // 2:4, 3:3, 4:2만 허용
            && sections.size() >= 4        // 4구간 이상
            && maxRun < 3;                 // 3연속 이상 금지
    }

    /** 완화 필터 (pool이 특정 구간에 편중될 때 폴백용) */
    private boolean passFilterRelaxed(int[] combo) {
        int sum = 0;
        Set<Integer> sections = new HashSet<>();
        Arrays.sort(combo);
        for (int v : combo) {
            sum += v;
            sections.add(sectionOf(v));
        }

        int maxRun = 1, curRun = 1;
        for (int i = 1; i < combo.length; i++) {
            if (combo[i] - combo[i-1] == 1) curRun++;
            else curRun = 1;
            if (curRun > maxRun) maxRun = curRun;
        }

        return sum >= 80 && sum <= 175
            && sections.size() >= 3
            && maxRun < 3;
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
