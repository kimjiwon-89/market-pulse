package com.marketpulse.domain.lotto.controller;

import com.marketpulse.domain.lotto.dto.*;
import com.marketpulse.domain.lotto.service.LottoService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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
    public ApiResponse<LottoAnalysisDto> latest() {
        return ApiResponse.success(lottoService.getLatest());
    }

    @Operation(summary = "전체 회차 목록")
    @GetMapping("/rounds")
    public ApiResponse<List<LottoResultDto>> rounds() {
        return ApiResponse.success(lottoService.getRounds());
    }

    @Operation(summary = "특정 회차 분석 조회")
    @GetMapping("/analysis")
    public ApiResponse<LottoAnalysisDto> analysis(@RequestParam int round) {
        return ApiResponse.success(lottoService.getAnalysis(round));
    }

    @Operation(summary = "전략별 누적 성적")
    @GetMapping("/stats")
    public ApiResponse<List<LottoStatsDto>> stats() {
        return ApiResponse.success(lottoService.getStats());
    }

    @Operation(summary = "내 조합 저장")
    @PostMapping("/combo")
    public ApiResponse<LottoUserComboDto> saveCombo(@RequestBody LottoUserComboRequestDto req) {
        return ApiResponse.success(lottoService.saveUserCombo(req));
    }

    @Operation(summary = "내 저장 조합 목록")
    @GetMapping("/combo")
    public ApiResponse<List<LottoUserComboDto>> getCombos() {
        return ApiResponse.success(lottoService.getUserCombos());
    }

    @Operation(summary = "내 조합 삭제")
    @DeleteMapping("/combo/{id}")
    public ApiResponse<Void> deleteCombo(@PathVariable Long id) {
        lottoService.deleteUserCombo(id);
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
}
