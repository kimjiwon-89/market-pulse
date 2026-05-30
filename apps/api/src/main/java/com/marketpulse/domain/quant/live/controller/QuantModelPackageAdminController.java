package com.marketpulse.domain.quant.live.controller;

import com.marketpulse.domain.quant.live.dto.QuantModelPackageDto;
import com.marketpulse.domain.quant.live.dto.QuantModelPackageVisibilityRequest;
import com.marketpulse.domain.quant.live.service.QuantModelPackageService;
import com.marketpulse.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/quant/packages")
@RequiredArgsConstructor
public class QuantModelPackageAdminController {
    private final QuantModelPackageService service;

    @GetMapping
    public ApiResponse<List<QuantModelPackageDto>> list() {
        return ApiResponse.success(service.scanAndList());
    }

    @PostMapping("/scan")
    public ApiResponse<List<QuantModelPackageDto>> scan() {
        return ApiResponse.success(service.scanAndList());
    }

    @PatchMapping("/{modelCode}/visibility")
    public ApiResponse<QuantModelPackageDto> updateVisibility(
            @PathVariable String modelCode,
            @RequestBody QuantModelPackageVisibilityRequest request) {
        return ApiResponse.success(service.updateVisibility(modelCode, request));
    }
}
