"use client";

import { AlertCircleIcon, CheckCircle2Icon, LoaderIcon } from "lucide-react";
import { usePageSaveStatusView } from "@/hooks/use-page-save-status";
import { cn } from "@/lib/utils";

/**
 * 페이지 우하단에 저장 중/완료/실패 상태를 고정 표시한다.
 */
export function PageSaveStatusIndicator() {
  const { phase } = usePageSaveStatusView();

  if (phase === "hidden") {
    return null;
  }

  const isSaving = phase === "saving";
  const isSaved = phase === "saved";
  const isError = phase === "error";

  return (
    <aside className="pointer-events-none fixed right-5 bottom-5 z-40">
      <div
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-2xl border px-3.5 py-2 font-medium text-[13px] shadow-[0_18px_40px_-20px_rgba(15,23,42,0.8)] backdrop-blur-md transition-colors",
          isSaving && "border-slate-300/70 bg-background/95 text-foreground",
          isSaved && "border-emerald-300/80 bg-emerald-50/95 text-emerald-700",
          isError && "border-rose-300/80 bg-rose-50/95 text-rose-700",
        )}
      >
        {isSaving ? (
          <>
            <LoaderIcon className="size-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : null}
        {isSaved ? (
          <>
            <CheckCircle2Icon className="size-4" />
            <span>Saved!</span>
          </>
        ) : null}
        {isError ? (
          <>
            <AlertCircleIcon className="size-4" />
            <span>Save failed</span>
          </>
        ) : null}
      </div>
    </aside>
  );
}
