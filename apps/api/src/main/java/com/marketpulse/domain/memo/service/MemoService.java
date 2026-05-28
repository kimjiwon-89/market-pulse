package com.marketpulse.domain.memo.service;

import com.marketpulse.domain.memo.dto.MemoCreateRequest;
import com.marketpulse.domain.memo.dto.MemoRecordResponse;
import com.marketpulse.domain.memo.dto.MemoUpdateRequest;
import com.marketpulse.domain.memo.mapper.MemoRecordMapper;
import com.marketpulse.domain.memo.vo.MemoRecordVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemoService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int MAX_PAGE_SIZE = 100;

    private final MemoRecordMapper memoRecordMapper;

    public List<MemoRecordResponse> findList(
            String username,
            String sourceType,
            String from,
            String to,
            String market,
            String stockCode,
            String keyword,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        return memoRecordMapper.findList(
                        username,
                        normalize(sourceType),
                        parseDate(from),
                        parseDate(to),
                        normalize(market),
                        normalize(stockCode),
                        normalize(keyword),
                        safeSize,
                        safePage * safeSize
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MemoRecordResponse> findContext(
            String username,
            String sourceType,
            String date,
            String market,
            String stockCode
    ) {
        return memoRecordMapper.findContext(
                        username,
                        requireSourceType(sourceType),
                        parseDate(date),
                        normalize(market),
                        normalize(stockCode)
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MemoRecordResponse create(MemoCreateRequest req, String username) {
        validateContent(req.getContent());
        MemoRecordVo vo = new MemoRecordVo();
        vo.setUsername(username);
        vo.setMemoDate(parseDate(req.getMemoDate()));
        vo.setSourceType(requireSourceType(req.getSourceType()));
        vo.setMarket(normalize(req.getMarket()));
        vo.setStockCode(normalize(req.getStockCode()));
        vo.setStockName(normalize(req.getStockName()));
        vo.setTitle(normalize(req.getTitle()));
        vo.setContent(req.getContent().trim());

        memoRecordMapper.insert(vo);
        return toResponse(memoRecordMapper.findByIdAndUsername(vo.getId(), username));
    }

    public MemoRecordResponse update(Long id, MemoUpdateRequest req, String username) {
        validateContent(req.getContent());
        int updated = memoRecordMapper.update(id, username, normalize(req.getTitle()), req.getContent().trim());
        if (updated == 0) {
            throw new IllegalArgumentException("수정할 메모를 찾을 수 없습니다.");
        }
        return toResponse(memoRecordMapper.findByIdAndUsername(id, username));
    }

    public void delete(Long id, String username) {
        int deleted = memoRecordMapper.delete(id, username);
        if (deleted == 0) {
            throw new IllegalArgumentException("삭제할 메모를 찾을 수 없습니다.");
        }
    }

    private MemoRecordResponse toResponse(MemoRecordVo vo) {
        return MemoRecordResponse.builder()
                .id(vo.getId())
                .username(vo.getUsername())
                .memoDate(vo.getMemoDate())
                .sourceType(vo.getSourceType())
                .market(vo.getMarket())
                .stockCode(vo.getStockCode())
                .stockName(vo.getStockName())
                .title(vo.getTitle())
                .content(vo.getContent())
                .createdAt(vo.getCreatedAt())
                .updatedAt(vo.getUpdatedAt())
                .build();
    }

    private String requireSourceType(String value) {
        String sourceType = normalize(value);
        if (sourceType == null) {
            throw new IllegalArgumentException("sourceType은 필수입니다.");
        }
        return sourceType;
    }

    private void validateContent(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("메모 내용은 필수입니다.");
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.replace("-", "");
        return LocalDate.parse(normalized, FMT);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
