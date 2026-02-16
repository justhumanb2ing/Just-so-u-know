import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isOnboardingComplete, resolveAuthProxyRedirectPath, resolveReturnPathFromReferer } from "@/lib/auth/route-access";

/**
 * 프록시 단계에서 세션 조회 실패 시 예외를 삼키고 비로그인 상태로 처리한다.
 */
async function resolveSessionOrNull(requestHeaders: Headers) {
  try {
    return await auth.api.getSession({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("[proxy] Failed to get session.", error);
    return null;
  }
}

/**
 * 브라우저 페이지 라우트에서 인증/온보딩 상태 기반 리다이렉트를 처리한다.
 *
 * 처리 기준:
 * - 비로그인 사용자는 `/onboarding` 접근 불가
 * - 로그인 + 온보딩 미완료 사용자는 `/onboarding` 외 모든 페이지 접근 불가
 * - 로그인 + 온보딩 완료 사용자는 `/sign-in` 접근 불가
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const returnPath = resolveReturnPathFromReferer(request.headers.get("referer"), request.nextUrl.origin, "/");
  let hasSession = false;
  let onboardingComplete = false;

  if (hasSessionCookie) {
    const session = await resolveSessionOrNull(request.headers);

    if (session) {
      hasSession = true;
      onboardingComplete = isOnboardingComplete(session.user.userMetadata);
    }
  }

  const redirectPath = resolveAuthProxyRedirectPath({
    pathname,
    hasSessionCookie,
    hasSession,
    onboardingComplete,
    returnPath,
  });

  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|opengraph-image|.*\\..*).*)"],
};
