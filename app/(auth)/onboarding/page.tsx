import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isOnboardingComplete, resolveReturnPathFromHeaders } from "@/lib/auth/route-access";

export default async function OnboardingPage() {
  const requestHeaders = await headers();
  const returnPath = resolveReturnPathFromHeaders(requestHeaders, "/");
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect(returnPath);
  }

  if (isOnboardingComplete(session.user.userMetadata)) {
    redirect(returnPath);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="font-semibold text-2xl">Onboarding</h1>
      <p className="text-muted-foreground text-sm">온보딩이 완료되지 않은 사용자만 접근할 수 있는 페이지입니다.</p>
    </main>
  );
}
