import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SocialLoginOptions } from "@/components/auth/social-login-options";
import { auth } from "@/lib/auth/auth";
import { resolveReturnPathFromHeaders, resolveReturnPathFromSearchParam } from "@/lib/auth/route-access";

type SignInPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const requestHeaders = await headers();
  const resolvedSearchParams = await searchParams;
  const refererBasedReturnPath = resolveReturnPathFromHeaders(requestHeaders, "/");
  const returnPath = resolveReturnPathFromSearchParam(resolvedSearchParams.returnTo, refererBasedReturnPath);
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (session) {
    redirect(returnPath);
  }

  return (
    <main className="flex h-full w-full flex-col justify-center gap-8">
      <h1 className="font-semibold text-2xl">Sign in</h1>
      <SocialLoginOptions callbackURL={returnPath} />
    </main>
  );
}
