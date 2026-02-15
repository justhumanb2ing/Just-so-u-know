"use client";

import { LoaderIcon } from "lucide-react";
import { usePageSaveStatusView } from "@/hooks/use-page-save-status";
import { cn } from "@/lib/utils";
import CopyUrlButton from "../layout/copy-button";

/**
 * 페이지 우하단에 저장 중/완료/실패 상태를 고정 표시한다.
 */
export function PageSaveStatusIndicator() {
  const { phase } = usePageSaveStatusView();

  if (phase === "hidden") {
    return (
      <div className="w-30 text-center">
        <CopyUrlButton className={"px-12 text-base"} />
      </div>
    );
  }

  const isSaving = phase === "saving";
  const isSaved = phase === "saved";
  const isError = phase === "error";

  return (
    <aside className="pointer-events-none z-40 w-30">
      <div
        className={cn(
          "flex min-h-10 items-center justify-center gap-2 rounded-2xl px-3.5 py-2 font-medium text-muted-foreground text-sm backdrop-blur-md transition-colors",
          isSaving && "border-slate-300/70 bg-background/95",
          isError && "text-destructive/80",
        )}
      >
        {isSaving ? (
          <>
            <LoaderIcon className="size-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : null}
        {isSaved ? <span>Saved!</span> : null}
        {isError ? <span>Save failed</span> : null}
      </div>
    </aside>
  );
}
