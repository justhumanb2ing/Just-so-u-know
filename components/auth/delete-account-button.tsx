"use client";

import { LoaderIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

type DeleteAccountButtonProps = {
  className?: string;
  label?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  wrapperClassName?: string;
};

export function DeleteAccountButton({
  className,
  label = "delete account",
  size = "sm",
  variant = "link",
  wrapperClassName,
}: DeleteAccountButtonProps = {}) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 회원 탈퇴 요청을 실행하며, 처리 중 중복 호출을 차단하고 오류를 표시한다.
   */
  const handleDeleteAccount = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      const result = await authClient.deleteUser({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });

      if (result?.error) {
        setErrorMessage(result.error.message ?? "Failed to delete account. Please try again.");
      }
    } catch {
      setErrorMessage("Failed to delete account. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-start gap-1", wrapperClassName)}>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant={variant}
              size={size}
              className={cn("h-auto px-0 py-0 text-muted-foreground text-xs", className)}
              disabled={isPending}
            />
          }
        >
          {label}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Your account data will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteAccount} disabled={isPending}>
              {isPending ? <LoaderIcon className="size-4 animate-spin" /> : null}
              {isPending ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {errorMessage ? <p className="text-destructive text-xs">{errorMessage}</p> : null}
    </div>
  );
}
