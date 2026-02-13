"use client";

import { DeleteAccountButton } from "@/components/auth/delete-account-button";
import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * 페이지 소유자 편집 툴바에서 사용하는 계정 액션 스타일을 화면 전용으로 캡슐화한다.
 */
export function PageOwnerAccountActions() {
  return (
    <div className="flex flex-col items-stretch gap-1">
      <SignOutButton
        label="Sign out"
        variant="ghost"
        size="lg"
        className="h-8 justify-start rounded-lg px-3 py-5 text-foreground text-sm"
        wrapperClassName="items-stretch gap-0"
      />
      <DeleteAccountButton
        label="Delete account"
        variant="ghost"
        size="lg"
        className="h-8 justify-start rounded-lg px-3 py-5 text-sm"
        wrapperClassName="items-stretch gap-0"
      />
    </div>
  );
}
