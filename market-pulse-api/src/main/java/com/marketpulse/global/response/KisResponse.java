package com.marketpulse.global.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KisResponse<T> {

    /** 응답코드 (0 = 성공) */
    private String rt_cd;

    /** 메시지 코드 */
    private String msg_cd;

    /** 메시지 */
    private String msg1;

    /** 실제 데이터 */
    private T output;

    /**
     * 성공 여부 검증
     */
    public void validate(){

        if(!"0".equals(rt_cd)){
            throw new RuntimeException(msg1);
        }

    }

}
