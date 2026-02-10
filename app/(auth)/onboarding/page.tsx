import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
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
    <main className="h-full w-full">
      <OnboardingForm />
    </main>
  );
}
