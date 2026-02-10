import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SocialLoginOptions } from "@/components/auth/social-login-options";
import { auth } from "@/lib/auth/auth";
import { resolveReturnPathFromHeaders } from "@/lib/auth/route-access";

export default async function SignInPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (session) {
    redirect(resolveReturnPathFromHeaders(requestHeaders, "/"));
  }

  return (
    <main className="flex h-full w-full flex-col justify-center gap-8">
      <h1 className="font-semibold text-2xl">Sign in</h1>
      <SocialLoginOptions />
    </main>
  );
}
