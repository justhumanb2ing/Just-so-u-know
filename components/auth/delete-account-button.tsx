"use client";

import { LoaderIcon } from "lucide-react";
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
import { Button } from "@/components/ui/test-button";
import { authClient } from "@/lib/auth/auth-client";

export function DeleteAccountButton() {
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
    <div className="flex flex-col items-start gap-1">
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="link"
              size="sm"
              className={"h-auto px-0 py-0 text-muted-foreground text-xs"}
              disabled={isPending}
            />
          }
        >
          delete account
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
