export const HANDLE_PATHNAME_PATTERN = /^\/@[a-z0-9]{3,20}$/i;

export const ANALYTICS_EVENT_NAMES = {
  profileView: "profile_view",
  authSignInClick: "auth_signin_click",
  authMyPageClick: "auth_mypage_click",
  authSocialLoginClick: "auth_social_login_click",
  signupStart: "signup_start",
  signupComplete: "signup_complete",
  featureUse: "feature_use",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[keyof typeof ANALYTICS_EVENT_NAMES];

export type CtaPlacement = "inline" | "floating";

export type SignupSource = "public_page" | "direct";

export type FeatureActorType = "owner" | "member" | "visitor";

/**
 * `/[handle]` 라우트 패턴 여부를 판별한다.
 * handle은 저장 포맷과 동일하게 `@` 접두어 + 영문/숫자 3~20자로 간주한다.
 */
export function isHandlePathname(pathname: string) {
  return HANDLE_PATHNAME_PATTERN.test(pathname);
}

/**
 * Umami 이벤트에 저장할 callback 경로를 정규화한다.
 * hash는 분석 의미가 작아 제거하고 path+query만 유지한다.
 */
export function resolveCallbackPath(callbackURL: string) {
  if (!callbackURL) {
    return "/";
  }

  if (callbackURL.startsWith("/")) {
    const url = new URL(callbackURL, "https://tsuki.local");
    return `${url.pathname}${url.search}`;
  }

  try {
    const url = new URL(callbackURL);
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

/**
 * 회원가입 시작 이벤트의 진입 소스를 callback 경로 기준으로 분류한다.
 */
export function resolveSignupSource(callbackPath: string): SignupSource {
  const pathname = callbackPath.split("?")[0] ?? "";

  if (isHandlePathname(pathname)) {
    return "public_page";
  }

  return "direct";
}
