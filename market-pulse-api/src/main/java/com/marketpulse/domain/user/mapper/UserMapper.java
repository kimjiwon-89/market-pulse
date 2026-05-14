package com.marketpulse.domain.user.mapper;

import com.marketpulse.domain.user.vo.UserVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {
    UserVo findByUsername(String username);
    List<UserVo> findAll();
    void insert(UserVo user);
    void deleteById(Long id);
    void updatePassword(@Param("id") Long id, @Param("passwordHash") String passwordHash);
    boolean existsByUsername(String username);
}
