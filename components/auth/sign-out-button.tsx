"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  label?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  wrapperClassName?: string;
};

export function SignOutButton({ className, label = "Sign out", size = "sm", variant = "link", wrapperClassName }: SignOutButtonProps = {}) {
  const router = useRouter();
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
            router.refresh();
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
    <div className={cn("flex flex-col items-start gap-1", wrapperClassName)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("h-auto px-0 py-0 text-muted-foreground text-xs", className)}
        nativeButton={true}
        onClick={handleSignOut}
        disabled={isPending}
      >
        {label}
      </Button>
      {errorMessage ? <p className="text-destructive text-xs">{errorMessage}</p> : null}
    </div>
  );
}
