"use client";

import { NotebookPenIcon, PlusIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type MemoSizeCode, type PageMemoDraftController, usePageMemoDraft } from "@/hooks/use-page-memo-draft";
import { cn } from "@/lib/utils";

type EditablePageMemoSectionProps = {
  storedHandle: string;
};

type MemoDraftEditorProps = {
  controller: PageMemoDraftController;
};

type MemoSavedListProps = {
  controller: PageMemoDraftController;
};

function getMemoCardHeightClass(sizeCode: MemoSizeCode) {
  if (sizeCode === "wide-short") {
    return "h-16";
  }

  return "h-16";
}

function MemoDraftEditor({ controller }: MemoDraftEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { draft, focusRequestId, handleDraftChange } = controller;

  useEffect(() => {
    if (!draft) {
      return;
    }

    if (focusRequestId <= 0) {
      return;
    }

    textareaRef.current?.focus();
  }, [draft, focusRequestId]);

  if (!draft) {
    return null;
  }

  return (
    <article className="h-16 overflow-hidden rounded-[16px] border p-3">
      <div className="flex h-full items-center overflow-hidden">
        <Textarea
          ref={textareaRef}
          value={draft.content}
          placeholder="Write your memo"
          onChange={handleDraftChange}
          className="scrollbar-hide wrap-break-word h-full min-h-0 w-full resize-none overflow-y-auto whitespace-pre-wrap rounded-sm border-0 p-2 text-base! leading-relaxed shadow-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-0"
        />
      </div>
    </article>
  );
}

function MemoSavedList({ controller }: MemoSavedListProps) {
  if (controller.savedMemos.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {controller.savedMemos.map((memo) => (
        <article
          key={memo.id}
          data-size-code={memo.sizeCode}
          className={cn(
            "flex flex-col justify-center overflow-hidden rounded-[16px] border p-3 px-6",
            getMemoCardHeightClass(memo.sizeCode),
          )}
        >
          <p className="line-clamp-1 h-fit w-full truncate text-base">{memo.content}</p>
        </article>
      ))}
    </div>
  );
}

/**
 * 페이지 소유자가 memo draft를 생성하고 자동 저장하는 UI 섹션.
 */
export function EditablePageMemoSection({ storedHandle }: EditablePageMemoSectionProps) {
  const controller = usePageMemoDraft({ storedHandle });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-lg tracking-tight">Memos</h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={controller.handleAddMemoDraft}
          className={cn("gap-1.5", controller.draft ? "border-primary/60" : undefined)}
        >
          {controller.draft ? <NotebookPenIcon className="size-4" /> : <PlusIcon className="size-4" />}
          {controller.draft ? "Continue Draft" : "Add Memo"}
        </Button>
      </div>
      <MemoDraftEditor controller={controller} />
      <MemoSavedList controller={controller} />
    </section>
  );
}
