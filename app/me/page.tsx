import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createNoIndexMetadata } from "@/config/seo/metadata";
import { auth } from "@/lib/auth/auth";
import { isOnboardingComplete, resolveMeRedirectPath } from "@/lib/auth/route-access";
import { findPrimaryPageHandleByUserId } from "@/service/onboarding/public-page";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Redirecting",
  description: "This route is used only for authenticated redirect flow.",
});

/**
 * 랜딩 CTA 전용 진입점.
 * 인증 상태에 따라 로그인/온보딩/primary 페이지로 서버 리다이렉트한다.
 */
export default async function MePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(
      resolveMeRedirectPath({
        hasSession: false,
        onboardingComplete: false,
        primaryPageHandle: null,
      }),
    );
  }

  const onboardingComplete = isOnboardingComplete(session.user.userMetadata);

  if (!onboardingComplete) {
    redirect(
      resolveMeRedirectPath({
        hasSession: true,
        onboardingComplete: false,
        primaryPageHandle: null,
      }),
    );
  }

  const primaryPage = await findPrimaryPageHandleByUserId(session.user.id);

  redirect(
    resolveMeRedirectPath({
      hasSession: true,
      onboardingComplete: true,
      primaryPageHandle: primaryPage?.handle ?? null,
    }),
  );
}
