"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { ItemComposerBar } from "@/components/public-page/page-item-composer-bar";
import { getPageItemRenderer } from "@/components/public-page/page-item-renderers";
import { Textarea } from "@/components/ui/textarea";
import type { InitialPageItem, PageItem } from "@/hooks/use-page-item-composer";
import { normalizeInitialPageItems, usePageItemComposer } from "@/hooks/use-page-item-composer";
import { cn } from "@/lib/utils";

type EditablePageItemSectionProps = {
  handle: string;
  initialItems?: InitialPageItem[];
};

type ReadonlyPageItemSectionProps = {
  items: InitialPageItem[];
};

type ItemListProps = {
  items: PageItem[];
  withBottomSpacing?: boolean;
  draftItem?: ReactNode;
};

type DraftItemCardProps = {
  draft: {
    content: string;
  };
  focusRequestId: number;
  onDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

function getItemCardHeightClass(sizeCode: PageItem["sizeCode"]) {
  if (sizeCode === "wide-short") {
    return "h-16";
  }

  if (sizeCode === "wide-tall") {
    return "h-28";
  }

  return "h-44";
}

function DraftItemCard({ draft, focusRequestId, onDraftChange }: DraftItemCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (focusRequestId <= 0) {
      return;
    }

    textareaRef.current?.focus();
  }, [focusRequestId]);

  return (
    <article className="h-16 overflow-hidden rounded-[16px] border p-3">
      <Textarea
        ref={textareaRef}
        value={draft.content}
        placeholder="Write your content"
        onChange={onDraftChange}
        className="scrollbar-hide wrap-break-word h-full min-h-0 w-full resize-none overflow-y-auto whitespace-pre-wrap rounded-sm border-0 p-2 text-base! leading-relaxed shadow-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-0"
      />
    </article>
  );
}

function ItemList({ items, withBottomSpacing = false, draftItem }: ItemListProps) {
  if (items.length === 0 && !draftItem) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-6", withBottomSpacing ? "pb-40" : undefined)}>
      {draftItem}
      {items.map((item) => {
        const ItemRenderer = getPageItemRenderer(item.typeCode);

        return (
          <article
            key={item.id}
            data-item-type={item.typeCode}
            data-size-code={item.sizeCode}
            className={cn(
              "flex flex-col justify-center gap-2 overflow-hidden rounded-[16px] border p-3 px-6",
              getItemCardHeightClass(item.sizeCode),
            )}
          >
            <ItemRenderer item={item} />
          </article>
        );
      })}
    </div>
  );
}

/**
 * 페이지 소유자가 전체 아이템을 확인하고 하단 작성 바를 통해 아이템을 추가하는 편집 섹션.
 */
export function EditablePageItemSection({ handle, initialItems = [] }: EditablePageItemSectionProps) {
  const controller = usePageItemComposer({
    handle,
    initialItems,
  });

  const draftItem = controller.draft ? (
    <DraftItemCard draft={controller.draft} focusRequestId={controller.focusRequestId} onDraftChange={controller.handleDraftChange} />
  ) : null;

  return (
    <section className="flex flex-col gap-3">
      <ItemList items={controller.items} withBottomSpacing draftItem={draftItem} />
      <ItemComposerBar hasDraft={Boolean(controller.draft)} onOpenComposer={controller.handleOpenComposer} />
    </section>
  );
}

/**
 * 방문자 화면에서 전체 타입 아이템 목록을 읽기 전용으로 렌더링한다.
 */
export function ReadonlyPageItemSection({ items }: ReadonlyPageItemSectionProps) {
  const normalizedItems = normalizeInitialPageItems(items);

  if (normalizedItems.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 flex flex-col gap-3">
      <ItemList items={normalizedItems} />
    </section>
  );
}
