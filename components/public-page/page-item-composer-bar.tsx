"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ItemComposerBarProps = {
  hasDraft: boolean;
  onOpenComposer: () => void;
};

/**
 * 페이지 하단에 고정되는 아이템 작성 바.
 * 현재는 텍스트 아이템 입력만 지원하며 이후 타입 확장을 전제로 분리한다.
 */
export function ItemComposerBar({ hasDraft, onOpenComposer }: ItemComposerBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-30 mx-auto w-full max-w-lg px-4">
      <section className="rounded-[20px] border bg-background/90 p-3 shadow-xl backdrop-blur-sm">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpenComposer}
          className={cn("gap-1.5", hasDraft ? "border-primary/60" : undefined)}
        >
          Add Item
        </Button>
      </section>
    </div>
  );
}
