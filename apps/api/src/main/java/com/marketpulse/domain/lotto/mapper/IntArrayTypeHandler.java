package com.marketpulse.domain.lotto.mapper;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;

/**
 * PostgreSQL integer[] ↔ Java int[] 변환
 */
public class IntArrayTypeHandler extends BaseTypeHandler<int[]> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, int[] parameter, JdbcType jdbcType) throws SQLException {
        Connection conn = ps.getConnection();
        Integer[] boxed = new Integer[parameter.length];
        for (int j = 0; j < parameter.length; j++) boxed[j] = parameter[j];
        Array array = conn.createArrayOf("integer", boxed);
        ps.setArray(i, array);
    }

    @Override
    public int[] getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return toIntArray(rs.getArray(columnName));
    }

    @Override
    public int[] getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return toIntArray(rs.getArray(columnIndex));
    }

    @Override
    public int[] getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return toIntArray(cs.getArray(columnIndex));
    }

    private int[] toIntArray(Array array) throws SQLException {
        if (array == null) return new int[0];
        Integer[] boxed = (Integer[]) array.getArray();
        int[] result = new int[boxed.length];
        for (int i = 0; i < boxed.length; i++) result[i] = boxed[i];
        return result;
    }
}
