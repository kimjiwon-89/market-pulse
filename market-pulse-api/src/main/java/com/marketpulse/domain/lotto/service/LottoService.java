package com.marketpulse.domain.lotto.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.lotto.dto.LottoResultRawDto;
import java.time.LocalDate;
import com.marketpulse.domain.lotto.dto.*;
import com.marketpulse.domain.lotto.mapper.LottoMapper;
import com.marketpulse.domain.lotto.vo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LottoService {

    private final LottoMapper lottoMapper;
    private final LottoAnalysisEngine engine;
    private final DhlotteryClient dhlotteryClient;
    private final ObjectMapper objectMapper;

    private static final Map<String, String> STRATEGY_NAMES = Map.of(
            "MOMENTUM",  "모멘텀",
            "SUBMARINE", "잠수함",
            "NETWORK",   "관계망",
            "PATTERN",   "위치 패턴",
            "AI_PICK",   "AI 스마트픽"
    );

    // ──────────────────────────────────────────────
    // 회차 조회
    // ──────────────────────────────────────────────

    public List<LottoResultDto> getRounds() {
        return lottoMapper.findAllResults().stream()
                .map(LottoResultDto::new)
                .collect(Collectors.toList());
    }

    public LottoAnalysisDto getAnalysis(int drawNo) {
        LottoResultVo result = lottoMapper.findResultByDrawNo(drawNo);
        List<LottoAnalysisPoolVo> pools = lottoMapper.findPoolsByDrawNo(drawNo);
        List<LottoAnalysisResultVo> results = lottoMapper.findAnalysisResultsByDrawNo(drawNo);

        Map<String, LottoAnalysisPoolVo>   poolMap   = toMap(pools,   LottoAnalysisPoolVo::getStrategy);
        Map<String, LottoAnalysisResultVo> resultMap = toMap(results, LottoAnalysisResultVo::getStrategy);

        List<LottoStrategyDto> strategies = STRATEGY_NAMES.entrySet().stream()
                .map(entry -> buildStrategyDto(entry.getKey(), entry.getValue(), poolMap, resultMap))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        List<LottoUserComboDto> myCombs = lottoMapper.findUserCombos().stream()
                .filter(vo -> vo.getDrawNo() == drawNo)
                .map(LottoUserComboDto::new)
                .collect(Collectors.toList());

        return LottoAnalysisDto.builder()
                .drawNo(drawNo)
                .drawDate(result != null ? result.getDrawDate() : null)
                .winningNumbers(result != null ? result.getNumbers() : null)
                .bonusNo(result != null ? result.getBonusNo() : null)
                .strategies(strategies)
                .myCombs(myCombs)
                .build();
    }

    public LottoAnalysisDto getLatest() {
        Integer latest = lottoMapper.findLatestDrawNo();
        if (latest == null) {
            // DB 비어있으면 동행복권에서 최신 회차 탐색 후 수집
            latest = dhlotteryClient.findLatestDrawNo();
            collectAndAnalyze(latest);
        }
        return getAnalysis(latest);
    }

    // ──────────────────────────────────────────────
    // 성적 통계
    // ──────────────────────────────────────────────

    public List<LottoStatsDto> getStats() {
        List<LottoAnalysisResultVo> all = lottoMapper.findAllAnalysisResults();

        return STRATEGY_NAMES.entrySet().stream().map(entry -> {
            String strategy = entry.getKey();
            List<LottoAnalysisResultVo> byStrategy = all.stream()
                    .filter(r -> strategy.equals(r.getStrategy()))
                    .collect(Collectors.toList());

            double avgPool = byStrategy.stream()
                    .mapToInt(LottoAnalysisResultVo::getPoolHitCount)
                    .average().orElse(0);

            double avgCombo = byStrategy.stream()
                    .mapToDouble(r -> avgComboHit(r.getComboResults()))
                    .average().orElse(0);

            List<LottoStatsDto.DrawHitDto> history = byStrategy.stream()
                    .map(r -> LottoStatsDto.DrawHitDto.builder()
                            .drawNo(r.getDrawNo())
                            .poolHitCount(r.getPoolHitCount())
                            .avgComboHit(avgComboHit(r.getComboResults()))
                            .build())
                    .collect(Collectors.toList());

            return LottoStatsDto.builder()
                    .strategy(strategy)
                    .strategyName(entry.getValue())
                    .avgPoolHit(avgPool)
                    .avgComboHit(avgCombo)
                    .totalDraws(byStrategy.size())
                    .history(history)
                    .build();
        }).collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────
    // 내 조합 저장 / 삭제
    // ──────────────────────────────────────────────

    public LottoUserComboDto saveUserCombo(LottoUserComboRequestDto req) {
        LottoUserComboVo vo = new LottoUserComboVo();
        vo.setDrawNo(req.getDrawNo());
        vo.setNumbers(req.getNumbers().stream().mapToInt(Integer::intValue).toArray());
        lottoMapper.insertUserCombo(vo);
        return new LottoUserComboDto(vo);
    }

    public List<LottoUserComboDto> getUserCombos() {
        return lottoMapper.findUserCombos().stream()
                .map(LottoUserComboDto::new)
                .collect(Collectors.toList());
    }

    public void deleteUserCombo(Long id) {
        lottoMapper.deleteUserCombo(id);
    }

    // ──────────────────────────────────────────────
    // 분석 실행 (스케줄러 + 초기 수집에서 호출)
    // ──────────────────────────────────────────────

    public void collectAndAnalyze(int drawNo) {
        // 1. 당첨 번호 수집
        LottoResultVo result = dhlotteryClient.fetch(drawNo);
        if (result == null) {
            log.warn("dhlottery fetch null, drawNo={}", drawNo);
            return;
        }
        lottoMapper.insertResult(result);

        // 2. 분석 데이터 충분한지 확인 (최소 100회차)
        List<LottoResultVo> history = lottoMapper.findRecentResults(100);
        if (history.size() < 10) {
            log.warn("not enough draw history: {}", history.size());
            return;
        }

        // 3. 전략별 풀 계산
        int[] momentum  = engine.momentum(history);
        int[] submarine = engine.submarine(history);
        int[] network   = engine.network(history);
        int[] pattern   = engine.pattern(history);
        int[] aiPick    = engine.aiPick(history, momentum, submarine, network, pattern);

        Map<String, int[]> poolMap = Map.of(
                "MOMENTUM",  momentum,
                "SUBMARINE", submarine,
                "NETWORK",   network,
                "PATTERN",   pattern,
                "AI_PICK",   aiPick
        );

        // 4. 각 전략 풀 저장 + 조합 생성
        for (Map.Entry<String, int[]> entry : poolMap.entrySet()) {
            String strategy = entry.getKey();
            int[] pool      = entry.getValue();

            // 점수 배열은 AI_PICK이 역배 보너스 적용
            double[] scoreRef = buildScoreRef(pool);
            boolean unpopular = "AI_PICK".equals(strategy);
            List<List<Integer>> combos = engine.generateCombos(pool, scoreRef, unpopular);

            LottoAnalysisPoolVo vo = new LottoAnalysisPoolVo();
            vo.setDrawNo(drawNo);
            vo.setStrategy(strategy);
            vo.setPoolNumbers(pool);
            vo.setCombos(toJson(combos));
            lottoMapper.upsertPool(vo);
        }

        // 5. 적중 분석 저장
        int[] winning = result.getNumbers();
        for (Map.Entry<String, int[]> entry : poolMap.entrySet()) {
            String strategy   = entry.getKey();
            int[]  pool       = entry.getValue();
            int    poolHit    = engine.calcHitCount(pool, winning);
            List<LottoAnalysisPoolVo> savedPools = lottoMapper.findPoolsByDrawNo(drawNo);

            // 조합별 적중 계산
            List<LottoComboResultDto> comboResults = getCombosFromPool(savedPools, strategy).stream()
                    .map(combo -> {
                        int hit = (int) combo.stream().filter(n -> {
                            for (int w : winning) if (w == n) return true;
                            return false;
                        }).count();
                        return new LottoComboResultDto(combo, hit);
                    }).collect(Collectors.toList());

            LottoAnalysisResultVo rv = new LottoAnalysisResultVo();
            rv.setDrawNo(drawNo);
            rv.setStrategy(strategy);
            rv.setPoolHitCount(poolHit);
            rv.setComboResults(toJson(comboResults));
            lottoMapper.upsertAnalysisResult(rv);
        }

        // 6. 사용자 저장 조합 적중 업데이트
        lottoMapper.findUserCombos().stream()
                .filter(uc -> uc.getDrawNo() == drawNo && uc.getHitCount() == null)
                .forEach(uc -> {
                    int hit = engine.calcHitCount(uc.getNumbers(), winning);
                    lottoMapper.updateUserComboHitCount(uc.getId(), hit);
                });

        log.info("lotto analysis done, drawNo={}", drawNo);
    }

    /** 브라우저 수집 데이터 bulk 저장 (분석은 analyzeAll()로 별도 실행) */
    public int bulkInsertResults(List<LottoResultRawDto> items) {
        int count = 0;
        for (LottoResultRawDto dto : items) {
            try {
                LottoResultVo vo = new LottoResultVo();
                vo.setDrawNo(dto.getDrwNo());
                vo.setDrawDate(LocalDate.parse(dto.getDrwNoDate()));
                vo.setNo1(dto.getDrwtNo1()); vo.setNo2(dto.getDrwtNo2()); vo.setNo3(dto.getDrwtNo3());
                vo.setNo4(dto.getDrwtNo4()); vo.setNo5(dto.getDrwtNo5()); vo.setNo6(dto.getDrwtNo6());
                vo.setBonusNo(dto.getBnusNo());
                lottoMapper.insertResult(vo);
                count++;
            } catch (Exception e) {
                log.warn("bulkInsert skip drawNo={}: {}", dto.getDrwNo(), e.getMessage());
            }
        }
        log.info("bulkInsertResults done: {}/{} saved", count, items.size());
        return count;
    }

    /** DB에 결과는 있지만 분석이 없는 회차 전체 일괄 분석 */
    public int analyzeAll() {
        List<LottoResultVo> allResults = lottoMapper.findAllResults();
        List<LottoAnalysisPoolVo> allPools = lottoMapper.findAllPools();
        java.util.Set<Integer> analyzed = allPools.stream()
                .map(LottoAnalysisPoolVo::getDrawNo)
                .collect(java.util.stream.Collectors.toSet());

        List<Integer> toAnalyze = allResults.stream()
                .map(LottoResultVo::getDrawNo)
                .filter(no -> !analyzed.contains(no))
                .sorted()
                .collect(Collectors.toList());

        log.info("analyzeAll: {} rounds to analyze", toAnalyze.size());
        for (Integer drawNo : toAnalyze) {
            try {
                analyzeOnly(drawNo);
            } catch (Exception e) {
                log.warn("analyzeAll skip drawNo={}: {}", drawNo, e.getMessage());
            }
        }
        return toAnalyze.size();
    }

    /** 당첨번호 직접 입력 후 분석 실행 (동행복권 봇차단 우회) */
    public void insertResultManual(int drawNo, String drawDate,
            int no1, int no2, int no3, int no4, int no5, int no6, int bonusNo) {
        LottoResultVo vo = new LottoResultVo();
        vo.setDrawNo(drawNo);
        vo.setDrawDate(LocalDate.parse(drawDate));
        vo.setNo1(no1); vo.setNo2(no2); vo.setNo3(no3);
        vo.setNo4(no4); vo.setNo5(no5); vo.setNo6(no6);
        vo.setBonusNo(bonusNo);
        lottoMapper.insertResult(vo);
        log.info("manual result inserted: drawNo={}", drawNo);

        List<LottoResultVo> history = lottoMapper.findRecentResults(100);
        if (history.size() < 10) {
            log.warn("not enough history for analysis: {}", history.size());
            return;
        }
        analyzeOnly(drawNo);
    }

    /** DB에 이미 있는 데이터로 분석만 실행 (동행복권 수집 없이) */
    public void analyzeOnly(int drawNo) {
        LottoResultVo result = lottoMapper.findResultByDrawNo(drawNo);
        if (result == null) {
            log.warn("analyzeOnly: drawNo={} not in DB", drawNo);
            return;
        }

        List<LottoResultVo> history = lottoMapper.findRecentResults(100);
        if (history.size() < 10) {
            log.warn("analyzeOnly: not enough history ({})", history.size());
            return;
        }

        int[] momentum  = engine.momentum(history);
        int[] submarine = engine.submarine(history);
        int[] network   = engine.network(history);
        int[] pattern   = engine.pattern(history);
        int[] aiPick    = engine.aiPick(history, momentum, submarine, network, pattern);

        Map<String, int[]> poolMap = Map.of(
                "MOMENTUM",  momentum, "SUBMARINE", submarine,
                "NETWORK",   network,  "PATTERN",   pattern, "AI_PICK", aiPick
        );

        for (Map.Entry<String, int[]> entry : poolMap.entrySet()) {
            String strategy = entry.getKey();
            int[]  pool     = entry.getValue();
            double[] scoreRef = buildScoreRef(pool);
            List<List<Integer>> combos = engine.generateCombos(pool, scoreRef, "AI_PICK".equals(strategy));

            LottoAnalysisPoolVo vo = new LottoAnalysisPoolVo();
            vo.setDrawNo(drawNo); vo.setStrategy(strategy);
            vo.setPoolNumbers(pool); vo.setCombos(toJson(combos));
            lottoMapper.upsertPool(vo);
        }

        int[] winning = result.getNumbers();
        for (Map.Entry<String, int[]> entry : poolMap.entrySet()) {
            String strategy = entry.getKey();
            int[]  pool     = entry.getValue();
            int    poolHit  = engine.calcHitCount(pool, winning);
            List<LottoAnalysisPoolVo> savedPools = lottoMapper.findPoolsByDrawNo(drawNo);
            List<LottoComboResultDto> comboResults = getCombosFromPool(savedPools, strategy).stream()
                    .map(combo -> {
                        int hit = (int) combo.stream().filter(n -> { for (int w : winning) if (w == n) return true; return false; }).count();
                        return new LottoComboResultDto(combo, hit);
                    }).collect(Collectors.toList());
            LottoAnalysisResultVo rv = new LottoAnalysisResultVo();
            rv.setDrawNo(drawNo); rv.setStrategy(strategy);
            rv.setPoolHitCount(poolHit); rv.setComboResults(toJson(comboResults));
            lottoMapper.upsertAnalysisResult(rv);
        }
        log.info("analyzeOnly done, drawNo={}", drawNo);
    }

    /** 역대 데이터 일괄 수집 (최초 1회 실행용) */
    public void collectHistorical(int fromDrawNo, int toDrawNo) {
        for (int no = fromDrawNo; no <= toDrawNo; no++) {
            LottoResultVo vo = dhlotteryClient.fetch(no);
            if (vo != null) {
                lottoMapper.insertResult(vo);
                log.info("collected drawNo={}", no);
                try { Thread.sleep(200); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
        }
        log.info("historical collection done: {}~{}", fromDrawNo, toDrawNo);
    }

    // ──────────────────────────────────────────────
    // 내부 헬퍼
    // ──────────────────────────────────────────────

    private LottoStrategyDto buildStrategyDto(
            String strategy, String name,
            Map<String, LottoAnalysisPoolVo> poolMap,
            Map<String, LottoAnalysisResultVo> resultMap) {

        LottoAnalysisPoolVo   pool   = poolMap.get(strategy);
        LottoAnalysisResultVo result = resultMap.get(strategy);
        if (pool == null) return null;

        List<Integer> poolList = toIntList(pool.getPoolNumbers());
        List<LottoComboResultDto> combos = parseCombos(pool.getCombos(), result);

        return LottoStrategyDto.builder()
                .strategy(strategy)
                .strategyName(name)
                .pool(poolList)
                .combos(combos)
                .poolHitCount(result != null ? result.getPoolHitCount() : null)
                .build();
    }

    private List<LottoComboResultDto> parseCombos(String combosJson, LottoAnalysisResultVo result) {
        if (combosJson == null) return Collections.emptyList();
        try {
            List<List<Integer>> combos = objectMapper.readValue(combosJson,
                    new TypeReference<List<List<Integer>>>() {});

            if (result == null || result.getComboResults() == null) {
                return combos.stream()
                        .map(c -> new LottoComboResultDto(c, null))
                        .collect(Collectors.toList());
            }

            List<LottoComboResultDto> comboResults = objectMapper.readValue(result.getComboResults(),
                    new TypeReference<List<LottoComboResultDto>>() {});
            return comboResults;
        } catch (Exception e) {
            log.warn("parseCombos error", e);
            return Collections.emptyList();
        }
    }

    private List<List<Integer>> getCombosFromPool(List<LottoAnalysisPoolVo> pools, String strategy) {
        return pools.stream()
                .filter(p -> strategy.equals(p.getStrategy()))
                .findFirst()
                .map(p -> {
                    try {
                        return objectMapper.readValue(p.getCombos(),
                                new TypeReference<List<List<Integer>>>() {});
                    } catch (Exception e) {
                        return Collections.<List<Integer>>emptyList();
                    }
                }).orElse(Collections.emptyList());
    }

    private double[] buildScoreRef(int[] pool) {
        double[] ref = new double[46];
        for (int i = 0; i < pool.length; i++) ref[pool[i]] = (double)(pool.length - i) / pool.length;
        return ref;
    }

    private double avgComboHit(String comboResultsJson) {
        if (comboResultsJson == null) return 0;
        try {
            List<LottoComboResultDto> list = objectMapper.readValue(comboResultsJson,
                    new TypeReference<List<LottoComboResultDto>>() {});
            return list.stream()
                    .filter(r -> r.getHitCount() != null)
                    .mapToInt(LottoComboResultDto::getHitCount)
                    .average().orElse(0);
        } catch (Exception e) {
            return 0;
        }
    }

    private <T> Map<String, T> toMap(List<T> list, java.util.function.Function<T, String> keyFn) {
        return list.stream().collect(Collectors.toMap(keyFn, v -> v));
    }

    private List<Integer> toIntList(int[] arr) {
        List<Integer> list = new ArrayList<>();
        for (int v : arr) list.add(v);
        return list;
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "[]"; }
    }
}
