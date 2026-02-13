"use client";

import { DeleteAccountButton } from "@/components/auth/delete-account-button";
import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * 온보딩 화면의 하단 계정 액션 영역 스타일을 한 컴포넌트로 고정한다.
 */
export function OnboardingAccountActions() {
  return (
    <aside className="flex items-center gap-3">
      <SignOutButton />
      <DeleteAccountButton />
    </aside>
  );
}
