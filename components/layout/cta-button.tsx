import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveCTAButtonState } from "@/components/layout/cta-button-state";
import { auth } from "@/lib/auth/auth";
import { Button } from "../ui/button";

/**
 * 홈 화면의 인증 CTA를 서버에서 결정해 불필요한 클라이언트 상태 구독을 줄인다.
 */
export default async function CTAButton() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  const state = resolveCTAButtonState(Boolean(session));

  if (state.action === "sign-in") {
    return (
      <Button
        variant={"default"}
        size={"lg"}
        className={"h-10"}
        nativeButton={state.nativeButton}
        render={<Link href={state.href}>{state.label}</Link>}
      />
    );
  }

  async function signOutAction() {
    "use server";

    await auth.api.signOut({
      headers: await headers(),
    });
    redirect("/");
  }

  return (
    <form action={signOutAction}>
      <Button type="submit">{state.label}</Button>
    </form>
  );
}
