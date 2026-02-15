import { headers } from "next/headers";
import Link from "next/link";
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
    <main className="relative flex h-full w-full flex-col justify-between gap-8">
      <div className="flex-1 basis-0">
        <Link href={"/"}>로고</Link>
      </div>

      <div className="flex-1 basis-0 space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-2xl">Welcome back</h1>
          <h2 className="text-muted-foreground">Let's make your own link in bio</h2>
        </div>
        <SocialLoginOptions callbackURL={returnPath} />
      </div>

      <div className="flex flex-1 basis-0 items-end justify-between">
        <aside className="text-sm">
          <div>Link in bio</div>
          <div>— more than a link.</div>
        </aside>
        <aside>
          <div className="text-sm">2026. All rights reserved.</div>
        </aside>
      </div>
    </main>
  );
}
