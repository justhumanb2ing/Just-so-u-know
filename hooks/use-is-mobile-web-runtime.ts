import { useEffect, useState } from "react";

const MOBILE_WEB_USER_AGENT_KEYWORDS = ["ipad", "iphone", "android"] as const;

/**
 * User Agent 문자열이 모바일 웹 런타임(iPad/iPhone/Android)인지 판별한다.
 */
export function isMobileWebUserAgent(userAgent: string) {
  const normalizedUserAgent = userAgent.toLowerCase();

  return MOBILE_WEB_USER_AGENT_KEYWORDS.some((keyword) => normalizedUserAgent.includes(keyword));
}

/**
 * SSR과 클라이언트 첫 렌더를 동일하게 맞춘 뒤, 마운트 후 User Agent로 모바일 런타임 여부를 갱신한다.
 */
export function useIsMobileWebRuntime() {
  const [isMobileWebRuntime, setIsMobileWebRuntime] = useState(false);

  useEffect(() => {
    const nextIsMobileWebRuntime = isMobileWebUserAgent(navigator.userAgent ?? "");
    setIsMobileWebRuntime((prevIsMobileWebRuntime) =>
      prevIsMobileWebRuntime === nextIsMobileWebRuntime ? prevIsMobileWebRuntime : nextIsMobileWebRuntime,
    );
  }, []);

  return isMobileWebRuntime;
}
