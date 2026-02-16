import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { createNoIndexMetadata } from "@/config/seo/metadata";
import { auth } from "@/lib/auth/auth";
import { isOnboardingComplete, resolveReturnPathFromHeaders } from "@/lib/auth/route-access";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Onboarding",
  description: "Complete your onboarding to continue.",
});

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
