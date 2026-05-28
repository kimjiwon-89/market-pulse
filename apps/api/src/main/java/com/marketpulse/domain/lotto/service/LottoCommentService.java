package com.marketpulse.domain.lotto.service;

import com.marketpulse.domain.lotto.dto.LottoCommentRequestDto;
import com.marketpulse.domain.lotto.dto.LottoCommentResponseDto;
import com.marketpulse.domain.lotto.dto.LottoCommentUpdateDto;
import com.marketpulse.domain.lotto.mapper.LottoCommentMapper;
import com.marketpulse.domain.lotto.vo.LottoCommentVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LottoCommentService {

    private final LottoCommentMapper commentMapper;

    public List<LottoCommentResponseDto> getComments(int drawNo, String currentUsername) {
        return commentMapper.findByDrawNo(drawNo).stream()
                .map(vo -> LottoCommentResponseDto.from(vo, currentUsername))
                .collect(Collectors.toList());
    }

    public LottoCommentResponseDto create(LottoCommentRequestDto req, String username) {
        LottoCommentVo vo = new LottoCommentVo();
        vo.setDrawNo(req.getDrawNo());
        vo.setUsername(username);
        vo.setContent(req.getContent());
        vo.setImageUrl(req.getImageUrl());
        commentMapper.insert(vo);
        return LottoCommentResponseDto.from(commentMapper.findById(vo.getId()), username);
    }

    public LottoCommentResponseDto update(Long id, LottoCommentUpdateDto req, String username) {
        LottoCommentVo existing = commentMapper.findById(id);
        if (existing == null || existing.isDeleted()) {
            throw new IllegalArgumentException("댓글을 찾을 수 없습니다.");
        }
        if (!existing.getUsername().equals(username)) {
            throw new SecurityException("본인 댓글만 수정할 수 있습니다.");
        }
        commentMapper.update(id, req.getContent(), req.getImageUrl());
        return LottoCommentResponseDto.from(commentMapper.findById(id), username);
    }

    public void delete(Long id, String username) {
        LottoCommentVo existing = commentMapper.findById(id);
        if (existing == null || existing.isDeleted()) {
            throw new IllegalArgumentException("댓글을 찾을 수 없습니다.");
        }
        if (!existing.getUsername().equals(username)) {
            throw new SecurityException("본인 댓글만 삭제할 수 있습니다.");
        }
        commentMapper.softDelete(id);
    }
}
