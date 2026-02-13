const MOBILE_WEB_USER_AGENT_KEYWORDS = ["ipad", "iphone", "android"] as const;

/**
 * User Agent 문자열이 모바일 웹 런타임(iPad/iPhone/Android)인지 판별한다.
 */
export function isMobileWebUserAgent(userAgent: string) {
  const normalizedUserAgent = userAgent.toLowerCase();

  return MOBILE_WEB_USER_AGENT_KEYWORDS.some((keyword) => normalizedUserAgent.includes(keyword));
}
