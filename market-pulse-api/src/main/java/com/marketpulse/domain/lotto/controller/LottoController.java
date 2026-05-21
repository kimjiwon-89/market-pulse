package com.marketpulse.domain.lotto.controller;

import com.marketpulse.domain.lotto.dto.*;
import com.marketpulse.domain.lotto.service.LottoService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Lotto", description = "로또 분석 연구소")
@RestController
@RequestMapping("/api/lotto")
@RequiredArgsConstructor
public class LottoController {

    private final LottoService lottoService;

    @Operation(summary = "최신 회차 분석")
    @GetMapping("/latest")
    public ApiResponse<LottoAnalysisDto> latest(Authentication auth) {
        return ApiResponse.success(lottoService.getLatest(username(auth)));
    }

    @Operation(summary = "전체 회차 목록")
    @GetMapping("/rounds")
    public ApiResponse<List<LottoResultDto>> rounds() {
        return ApiResponse.success(lottoService.getRounds());
    }

    @Operation(summary = "특정 회차 분석 조회")
    @GetMapping("/analysis")
    public ApiResponse<LottoAnalysisDto> analysis(@RequestParam int round, Authentication auth) {
        return ApiResponse.success(lottoService.getAnalysis(round, username(auth)));
    }

    @Operation(summary = "전략별 누적 성적")
    @GetMapping("/stats")
    public ApiResponse<List<LottoStatsDto>> stats() {
        return ApiResponse.success(lottoService.getStats());
    }

    @Operation(summary = "내 조합 저장")
    @PostMapping("/combo")
    public ApiResponse<LottoUserComboDto> saveCombo(@RequestBody LottoUserComboRequestDto req,
                                                    Authentication auth) {
        return ApiResponse.success(lottoService.saveUserCombo(req, auth.getName()));
    }

    @Operation(summary = "내 저장 조합 목록")
    @GetMapping("/combo")
    public ApiResponse<List<LottoUserComboDto>> getCombos(Authentication auth) {
        return ApiResponse.success(lottoService.getUserCombos(auth.getName()));
    }

    @Operation(summary = "내 조합 삭제")
    @DeleteMapping("/combo/{id}")
    public ApiResponse<Void> deleteCombo(@PathVariable Long id, Authentication auth) {
        lottoService.deleteUserCombo(id, auth.getName());
        return ApiResponse.success(null);
    }

    @Operation(summary = "DB 데이터로 분석만 실행 (동행복권 수집 없이)")
    @PostMapping("/analyze")
    public ApiResponse<String> analyze(@RequestParam int round) {
        lottoService.analyzeOnly(round);
        return ApiResponse.success("분석 완료: " + round);
    }

    @Operation(summary = "역대 데이터 일괄 수집 (관리자용)")
    @PostMapping("/collect")
    public ApiResponse<String> collect(
            @RequestParam int from,
            @RequestParam int to) {
        lottoService.collectHistorical(from, to);
        return ApiResponse.success("수집 완료: " + from + "~" + to);
    }

    @Operation(summary = "당첨번호 대량 저장 (브라우저 수집 → bulk import)")
    @PostMapping("/bulk-results")
    public ApiResponse<String> bulkResults(@RequestBody List<LottoResultRawDto> items) {
        int saved = lottoService.bulkInsertResults(items);
        return ApiResponse.success("저장 완료: " + saved + "건, 분석은 /analyze-all 호출");
    }

    @Operation(summary = "DB에 있는 미분석 회차 전체 일괄 분석")
    @PostMapping("/analyze-all")
    public ApiResponse<String> analyzeAll() {
        int count = lottoService.analyzeAll();
        return ApiResponse.success("분석 완료: " + count + "회차");
    }

    @Operation(summary = "당첨번호 수동 입력 + 분석 실행 (동행복권 봇차단 우회용)")
    @PostMapping("/result")
    public ApiResponse<String> insertResult(
            @RequestParam int drawNo,
            @RequestParam String drawDate,
            @RequestParam int no1,
            @RequestParam int no2,
            @RequestParam int no3,
            @RequestParam int no4,
            @RequestParam int no5,
            @RequestParam int no6,
            @RequestParam int bonusNo) {
        lottoService.insertResultManual(drawNo, drawDate, no1, no2, no3, no4, no5, no6, bonusNo);
        return ApiResponse.success("입력 + 분석 완료: " + drawNo + "회");
    }

    private String username(Authentication auth) {
        return auth != null ? auth.getName() : null;
    }
}
