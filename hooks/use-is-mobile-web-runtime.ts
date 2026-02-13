import { useState } from "react";

const MOBILE_WEB_USER_AGENT_KEYWORDS = ["ipad", "iphone", "android"] as const;

/**
 * User Agent 문자열이 모바일 웹 런타임(iPad/iPhone/Android)인지 판별한다.
 */
export function isMobileWebUserAgent(userAgent: string) {
  const normalizedUserAgent = userAgent.toLowerCase();

  return MOBILE_WEB_USER_AGENT_KEYWORDS.some((keyword) => normalizedUserAgent.includes(keyword));
}

/**
 * 현재 JS 런타임의 User Agent를 기준으로 모바일 웹 실행 여부를 1회 계산한다.
 * User Agent는 런타임 중 바뀌지 않으므로 state 초기화 함수만 사용해 불필요한 재계산을 피한다.
 */
export function useIsMobileWebRuntime() {
  const [isMobileWebRuntime] = useState(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return isMobileWebUserAgent(navigator.userAgent ?? "");
  });

  return isMobileWebRuntime;
}
