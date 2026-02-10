"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

export function SignOutButton() {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 로그아웃 요청의 중복 전송을 방지하고 실패 시 사용자에게 오류를 노출한다.
   */
  const handleSignOut = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      const result = await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });

      if (result?.error) {
        setErrorMessage(result.error.message ?? "Failed to sign out. Please try again.");
      }
    } catch {
      setErrorMessage("Failed to sign out. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="link"
        size="sm"
        className={"h-auto px-0 py-0 text-muted-foreground text-xs"}
        onClick={handleSignOut}
        disabled={isPending}
      >
        sign out
      </Button>
      {errorMessage ? <p className="text-destructive text-xs">{errorMessage}</p> : null}
    </div>
  );
}
