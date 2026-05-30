package com.marketpulse.domain.quant.live.dto;

public record QuantModelPackageVisibilityRequest(
        boolean publicVisible,
        String packageStatus,
        String adminNote
) {
}
