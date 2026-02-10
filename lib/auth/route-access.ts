const BLOCKED_RETURN_PATHS = ["/sign-in", "/onboarding"] as const;
const ONBOARDING_PATH = "/onboarding";
const SIGN_IN_PATH = "/sign-in";

function normalizeReturnPath(candidate: string | null | undefined, fallback = "/") {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  const [pathname] = candidate.split("?");
  if (BLOCKED_RETURN_PATHS.some((blockedPath) => pathname === blockedPath)) {
    return fallback;
  }

  return candidate;
}

export function resolveReturnPathFromReferer(referer: string | null, currentOrigin: string, fallback = "/") {
  if (!referer) {
    return fallback;
  }

  try {
    const refererUrl = new URL(referer);
    if (refererUrl.origin !== currentOrigin) {
      return fallback;
    }

    const candidatePath = `${refererUrl.pathname}${refererUrl.search}`;
    return normalizeReturnPath(candidatePath, fallback);
  } catch {
    return fallback;
  }
}

function resolveRequestOriginFromHeaders(requestHeaders: Headers) {
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) {
    return null;
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export function resolveReturnPathFromHeaders(requestHeaders: Headers, fallback = "/") {
  const currentOrigin = resolveRequestOriginFromHeaders(requestHeaders);
  if (!currentOrigin) {
    return fallback;
  }

  return resolveReturnPathFromReferer(requestHeaders.get("referer"), currentOrigin, fallback);
}

export type ResolveAuthProxyRedirectPathInput = {
  pathname: string;
  hasSessionCookie: boolean;
  hasSession: boolean;
  onboardingComplete: boolean;
  returnPath: string;
};

export type ResolveMeRedirectPathInput = {
  hasSession: boolean;
  onboardingComplete: boolean;
  primaryPageHandle: string | null;
};

/**
 * 브라우저 페이지 라우트 기준으로 proxy 리다이렉트 경로를 계산한다.
 *
 * 우선순위:
 * 1) 세션이 없는 사용자의 `/onboarding` 접근 차단
 * 2) 로그인 + 온보딩 미완료 사용자의 전역 `/onboarding` 강제
 * 3) 로그인 + 온보딩 완료 사용자의 `/sign-in` 접근 차단
 */
export function resolveAuthProxyRedirectPath({
  pathname,
  hasSessionCookie,
  hasSession,
  onboardingComplete,
  returnPath,
}: ResolveAuthProxyRedirectPathInput) {
  if (pathname === ONBOARDING_PATH && !hasSession) {
    return returnPath;
  }

  if (!hasSessionCookie) {
    return null;
  }

  if (!hasSession) {
    return null;
  }

  if (!onboardingComplete) {
    if (pathname === ONBOARDING_PATH) {
      return null;
    }

    return ONBOARDING_PATH;
  }

  if (pathname === SIGN_IN_PATH) {
    return returnPath;
  }

  return null;
}

/**
 * `/me` 페이지에서 인증/온보딩/primary 페이지 상태별 최종 이동 경로를 계산한다.
 */
export function resolveMeRedirectPath({ hasSession, onboardingComplete, primaryPageHandle }: ResolveMeRedirectPathInput) {
  if (!hasSession) {
    return SIGN_IN_PATH;
  }

  if (!onboardingComplete) {
    return ONBOARDING_PATH;
  }

  if (!primaryPageHandle || !primaryPageHandle.startsWith("@")) {
    return ONBOARDING_PATH;
  }

  return `/${primaryPageHandle}`;
}

export function isOnboardingComplete(userMetadata: unknown) {
  if (!userMetadata || typeof userMetadata !== "object") {
    return false;
  }

  const metadata = userMetadata as { onboardingComplete?: unknown };
  return metadata.onboardingComplete === true;
}
