"use client";

import { RectangleHorizontalIcon, SquareIcon, TrashIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Rectangle } from "@/components/icons/rectangle";
import { ItemComposerBar } from "@/components/public-page/page-item-composer-bar";
import { getPageItemRenderer } from "@/components/public-page/page-item-renderers";
import {
  PUBLIC_PAGE_ITEM_REMOVE_BUTTON_CLASSNAME,
  PUBLIC_PAGE_ITEM_RESIZE_GROUP_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Textarea } from "@/components/ui/textarea";
import { useOgCrawl } from "@/hooks/use-og-crawl";
import type { InitialPageItem, PageItem } from "@/hooks/use-page-item-composer";
import { normalizeInitialPageItems, usePageItemComposer } from "@/hooks/use-page-item-composer";
import { cn } from "@/lib/utils";

const ITEM_REMOVE_TAP = { scale: 0.92 } as const;
const ITEM_BUTTON_TRANSITION = {
  duration: 0.06,
  ease: "easeOut",
} as const;

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
  itemActions?: EditableItemActions;
  onMemoChange?: (itemId: string, nextValue: string) => void;
  onLinkTitleChange?: (itemId: string, nextValue: string) => void;
  onLinkTitleSubmit?: (itemId: string) => void;
};

type DraftItemCardProps = {
  draft: {
    content: string;
  };
  focusRequestId: number;
  onDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

type EditableItemActions = {
  onRemove: (itemId: string) => void;
  onResize: (itemId: string, nextSizeCode: PageItem["sizeCode"]) => void;
};

const PAGE_ITEM_RESIZE_OPTIONS: Array<{
  sizeCode: PageItem["sizeCode"];
  ariaLabel: string;
  icon: ReactNode;
}> = [
  {
    sizeCode: "wide-short",
    ariaLabel: "Set wide short size",
    icon: <RectangleHorizontalIcon className="size-4" strokeWidth={2.5} />,
  },
  {
    sizeCode: "wide-tall",
    ariaLabel: "Set wide tall size",
    icon: <Rectangle className="size-5" />,
  },
  {
    sizeCode: "wide-full",
    ariaLabel: "Set wide full size",
    icon: <SquareIcon className="size-4" strokeWidth={2.5} />,
  },
];

const PAGE_ITEM_CARD_BASE_CLASSNAME = "group relative flex flex-col justify-center gap-2 rounded-[16px] p-3 bg-muted/70";

type PageItemCardStyleConfig = {
  className?: string;
  sizeClassByCode?: Partial<Record<PageItem["sizeCode"], string>>;
};

const DEFAULT_PAGE_ITEM_CARD_STYLE_CONFIG: PageItemCardStyleConfig = {
  className: "overflow-visible",
};

/**
 * 아이템 타입별 카드 스타일 확장 포인트.
 * 타입 추가 시 map에 key를 추가하면 카드 클래스/사이즈 전략을 독립적으로 확장할 수 있다.
 */
const PAGE_ITEM_CARD_STYLE_CONFIG_MAP: Record<string, PageItemCardStyleConfig> = {
  memo: {
    className: "overflow-visible",
  },
  link: {
    className: "overflow-visible p-2",
  },
  image: {
    className: "overflow-visible",
  },
};

function getItemCardSizeClass(sizeCode: PageItem["sizeCode"]) {
  if (sizeCode === "wide-short") {
    return "h-16";
  }

  if (sizeCode === "wide-tall") {
    return "h-40";
  }

  return "aspect-square";
}

function resolvePageItemCardClassName(item: PageItem) {
  const styleConfig = PAGE_ITEM_CARD_STYLE_CONFIG_MAP[item.typeCode] ?? DEFAULT_PAGE_ITEM_CARD_STYLE_CONFIG;
  const sizeClass = styleConfig.sizeClassByCode?.[item.sizeCode] ?? getItemCardSizeClass(item.sizeCode);

  return cn(PAGE_ITEM_CARD_BASE_CLASSNAME, sizeClass, styleConfig.className);
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
    <article className="h-16 overflow-hidden rounded-[16px] bg-muted/70 p-3">
      <Textarea
        ref={textareaRef}
        value={draft.content}
        placeholder="Write your content"
        onChange={onDraftChange}
        className="scrollbar-hide wrap-break-word h-full min-h-0 w-full resize-none overflow-y-auto whitespace-pre-wrap rounded-sm border-0 p-2 text-base! leading-relaxed shadow-none hover:bg-input/60 focus-visible:bg-input/60 focus-visible:ring-0"
      />
    </article>
  );
}

function EditableItemActionControls({ item, itemActions }: { item: PageItem; itemActions: EditableItemActions }) {
  return (
    <>
      <motion.button
        type="button"
        className={cn(buttonVariants({ size: "icon-lg" }), PUBLIC_PAGE_ITEM_REMOVE_BUTTON_CLASSNAME)}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          itemActions.onRemove(item.id);
        }}
        aria-label="Remove item"
        whileTap={ITEM_REMOVE_TAP}
        transition={ITEM_BUTTON_TRANSITION}
      >
        <TrashIcon className="size-4" strokeWidth={3} />
      </motion.button>
      <ButtonGroup
        aria-label="Item size options"
        orientation={"horizontal"}
        className={cn(
          PUBLIC_PAGE_ITEM_RESIZE_GROUP_CLASSNAME,
          "phantom-border gap-1 rounded-sm p-1.5 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
        )}
      >
        {PAGE_ITEM_RESIZE_OPTIONS.map((option) => {
          const isSelected = option.sizeCode === item.sizeCode;
          const isOptionDisabled = item.typeCode === "link" && option.sizeCode !== "wide-short";

          return (
            <motion.button
              key={option.sizeCode}
              type="button"
              aria-label={option.ariaLabel}
              disabled={isOptionDisabled}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                if (isOptionDisabled) {
                  return;
                }

                itemActions.onResize(item.id, option.sizeCode);
              }}
              className={cn(
                buttonVariants({ size: "icon-xs", variant: "ghost" }),
                "size-7 rounded-[4px]! border-0 p-0 text-background hover:bg-background/20 hover:text-background",
                isSelected && "bg-background text-foreground hover:bg-background hover:text-foreground",
                isOptionDisabled && "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-background",
              )}
              whileTap={ITEM_REMOVE_TAP}
              transition={ITEM_BUTTON_TRANSITION}
            >
              {option.icon}
            </motion.button>
          );
        })}
      </ButtonGroup>
    </>
  );
}

function ItemList({
  items,
  withBottomSpacing = false,
  draftItem,
  itemActions,
  onMemoChange,
  onLinkTitleChange,
  onLinkTitleSubmit,
}: ItemListProps) {
  if (items.length === 0 && !draftItem) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-3", withBottomSpacing ? "pb-40" : undefined)}>
      {items.map((item) => {
        const ItemRenderer = getPageItemRenderer(item.typeCode);

        return (
          <article
            key={item.id}
            data-item-type={item.typeCode}
            data-size-code={item.sizeCode}
            className={resolvePageItemCardClassName(item)}
          >
            {itemActions ? <EditableItemActionControls item={item} itemActions={itemActions} /> : null}
            <ItemRenderer
              item={item}
              canEditMemo={Boolean(itemActions)}
              onMemoChange={onMemoChange}
              canEditLinkTitle={Boolean(itemActions)}
              onLinkTitleChange={onLinkTitleChange}
              onLinkTitleSubmit={onLinkTitleSubmit}
            />
          </article>
        );
      })}
      {draftItem}
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
  const ogController = useOgCrawl({
    onLookupSuccess: controller.handleCreateLinkItemFromOg,
  });

  const draftItem = controller.draft ? (
    <DraftItemCard draft={controller.draft} focusRequestId={controller.focusRequestId} onDraftChange={controller.handleDraftChange} />
  ) : null;
  const itemActions: EditableItemActions = {
    onRemove: controller.handleRemoveItem,
    onResize: controller.handleItemResize,
  };

  return (
    <section className="flex flex-col gap-3">
      <ItemList
        items={controller.items}
        withBottomSpacing
        draftItem={draftItem}
        itemActions={itemActions}
        onMemoChange={controller.handleItemMemoChange}
        onLinkTitleChange={controller.handleItemLinkTitleChange}
        onLinkTitleSubmit={controller.handleItemLinkTitleSubmit}
      />
      <ItemComposerBar hasDraft={Boolean(controller.draft)} onOpenComposer={controller.handleOpenComposer} ogController={ogController} />
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
