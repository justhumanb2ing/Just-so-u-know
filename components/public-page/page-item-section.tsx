"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RectangleHorizontalIcon, SquareIcon, TrashIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ChangeEvent, ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Rectangle } from "@/components/icons/rectangle";
import { ItemComposerBar } from "@/components/public-page/page-item-composer-bar";
import { getPageItemRenderer } from "@/components/public-page/page-item-renderers";
import { buildItemEntryMotionConfig } from "@/components/public-page/page-motion";
import {
  PUBLIC_PAGE_ITEM_REMOVE_BUTTON_CLASSNAME,
  PUBLIC_PAGE_ITEM_RESIZE_GROUP_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useIsMobileWebRuntime } from "@/hooks/use-is-mobile-web-runtime";
import { useOgCrawl } from "@/hooks/use-og-crawl";
import type { InitialPageItem, MapItemCreatePayload, PageItem } from "@/hooks/use-page-item-composer";
import { usePageItemComposer } from "@/hooks/use-page-item-composer";
import { cn } from "@/lib/utils";

const ITEM_REMOVE_TAP = { scale: 0.92 } as const;
const ITEM_BUTTON_TRANSITION = {
  duration: 0.06,
  ease: "easeOut",
} as const;
const ITEM_RESIZE_LAYOUT_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
} as const;
const NON_DRAGGABLE_SELECTOR = "input,textarea,a,button,[contenteditable='true'],[data-no-dnd='true']";

type EditablePageItemSectionProps = {
  handle: string;
  initialItems?: InitialPageItem[];
  composerAppearDelayMs?: number;
};

type ItemListProps = {
  items: PageItem[];
  withBottomSpacing?: boolean;
  draftItem?: ReactNode;
  draftState?: DraftItemAnimationState | null;
  dndContextId?: string;
  itemActions?: EditableItemActions;
  onMemoChange?: (itemId: string, nextValue: string) => void;
  onLinkTitleChange?: (itemId: string, nextValue: string) => void;
  onLinkTitleSubmit?: (itemId: string) => void;
  onItemReorder?: (activeItemId: string, overItemId: string) => void;
};

type DraftItemAnimationState = {
  isSaving: boolean;
};

type DraftItemCardProps = {
  draft: {
    kind: "memo" | "link" | "media";
    mediaType?: "image" | "video";
    content: string;
    isSaving: boolean;
  };
  focusRequestId: number;
  onDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onDraftRemove: () => void;
};

type EditableItemActions = {
  onRemove: (itemId: string) => void;
  onResize: (itemId: string, nextSizeCode: PageItem["sizeCode"]) => void;
  onMapSave: (itemId: string, payload: MapItemCreatePayload) => Promise<boolean>;
};

type SortableItemCardProps = {
  item: PageItem;
  itemActions?: EditableItemActions;
  onMemoChange?: (itemId: string, nextValue: string) => void;
  onLinkTitleChange?: (itemId: string, nextValue: string) => void;
  onLinkTitleSubmit?: (itemId: string) => void;
  reorderEnabled?: boolean;
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

const PAGE_ITEM_CARD_BASE_CLASSNAME = "group relative gap-2 rounded-[16px] p-3 bg-muted/70";

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
    className: "overflow-visible p-2 flex flex-col justify-center",
  },
  map: {
    className: "overflow-visible p-0",
  },
  image: {
    className: "overflow-visible p-0",
  },
  video: {
    className: "overflow-visible p-0",
  },
};

/**
 * 아이템 타입/사이즈 조합 기준으로 리사이즈 옵션 비활성화 여부를 계산한다.
 */
export function isItemResizeOptionDisabled(itemTypeCode: string, sizeCode: PageItem["sizeCode"]) {
  if (itemTypeCode === "link") {
    return sizeCode !== "wide-short";
  }

  if (itemTypeCode === "map" || itemTypeCode === "image" || itemTypeCode === "video") {
    return sizeCode === "wide-short";
  }

  return false;
}

/**
 * input/textarea/link 등 상호작용 가능한 요소에서는 카드 드래그를 막는다.
 */
function shouldAllowCardDrag(eventTarget: EventTarget | null) {
  if (!(eventTarget instanceof HTMLElement)) {
    return true;
  }

  return eventTarget.closest(NON_DRAGGABLE_SELECTOR) === null;
}

export { shouldAllowCardDrag };

/**
 * 카드 전체를 드래그 트리거로 사용하되, 상호작용 요소에서의 포인터 다운은 제외한다.
 */
class PageItemPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: ReactPointerEvent) => shouldAllowCardDrag(nativeEvent.target),
    },
  ];
}

function toItemId(identifier: UniqueIdentifier | null | undefined) {
  if (typeof identifier === "string") {
    return identifier;
  }

  if (typeof identifier === "number") {
    return String(identifier);
  }

  return null;
}

type ResolveSkippedItemEntryAnimationIdsParams = {
  previousItemIds: string[];
  nextItemIds: string[];
  previousDraft: {
    exists: boolean;
    isSaving: boolean;
  };
  nextDraftExists: boolean;
};

/**
 * 드래프트 저장 성공으로 실제 아이템이 추가된 프레임을 감지해
 * "드래프트 -> 실아이템" 치환 시에는 신규 아이템 진입 애니메이션을 건너뛴다.
 */
export function resolveSkippedItemEntryAnimationIds({
  previousItemIds,
  nextItemIds,
  previousDraft,
  nextDraftExists,
}: ResolveSkippedItemEntryAnimationIdsParams) {
  if (!(previousDraft.exists && previousDraft.isSaving) || nextDraftExists) {
    return [];
  }

  const previousItemIdSet = new Set(previousItemIds);
  const addedItemIds = nextItemIds.filter((itemId) => !previousItemIdSet.has(itemId));

  return addedItemIds.length > 0 ? addedItemIds : [];
}

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

function DraftItemCard({ draft, focusRequestId, onDraftChange, onDraftRemove }: DraftItemCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (draft.kind !== "memo" || focusRequestId <= 0) {
      return;
    }

    textareaRef.current?.focus();
  }, [draft.kind, focusRequestId]);

  if (draft.kind === "link") {
    return (
      <article className="group relative h-16 overflow-visible rounded-[16px] bg-muted/70 p-2">
        <div className="flex h-full w-full items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-sm" />
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <Skeleton className="h-10 w-full rounded-sm" />
          </div>
        </div>
      </article>
    );
  }

  if (draft.kind === "media") {
    return (
      <article className="group relative h-40 overflow-visible rounded-[16px] bg-muted/70 p-0">
        <div className="relative h-full w-full overflow-hidden rounded-[16px]">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      </article>
    );
  }

  return (
    <article className="group relative h-16 overflow-visible rounded-[16px] bg-muted/70 p-3">
      <motion.button
        type="button"
        className={cn(buttonVariants({ size: "icon-lg" }), PUBLIC_PAGE_ITEM_REMOVE_BUTTON_CLASSNAME)}
        aria-label="Remove draft item"
        disabled={draft.isSaving}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDraftRemove();
        }}
        whileTap={ITEM_REMOVE_TAP}
        transition={ITEM_BUTTON_TRANSITION}
      >
        <TrashIcon className="size-4" strokeWidth={3} />
      </motion.button>
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
        data-no-dnd="true"
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
        data-no-dnd="true"
        className={cn(
          PUBLIC_PAGE_ITEM_RESIZE_GROUP_CLASSNAME,
          "phantom-border gap-1 rounded-sm p-1.5 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
        )}
      >
        {PAGE_ITEM_RESIZE_OPTIONS.map((option) => {
          const isSelected = option.sizeCode === item.sizeCode;
          const isOptionDisabled = isItemResizeOptionDisabled(item.typeCode, option.sizeCode);

          return (
            <motion.button
              key={option.sizeCode}
              type="button"
              data-no-dnd="true"
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

function SortableItemCard({
  item,
  itemActions,
  onMemoChange,
  onLinkTitleChange,
  onLinkTitleSubmit,
  reorderEnabled = false,
}: SortableItemCardProps) {
  const ItemRenderer = getPageItemRenderer(item.typeCode);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !reorderEnabled,
  });
  const displayTransform = transform
    ? {
        ...transform,
        scaleX: isDragging ? 1.03 : transform.scaleX,
        scaleY: isDragging ? 1.03 : transform.scaleY,
      }
    : null;
  const style = reorderEnabled
    ? {
        transform: CSS.Transform.toString(displayTransform),
        transition,
        zIndex: isDragging ? 40 : undefined,
      }
    : undefined;
  const dndBindings = reorderEnabled
    ? {
        ...attributes,
        ...listeners,
      }
    : {};

  return (
    <article
      ref={setNodeRef}
      style={style}
      data-item-type={item.typeCode}
      data-size-code={item.sizeCode}
      className={cn(resolvePageItemCardClassName(item), isDragging && "bg-transparent")}
      {...dndBindings}
    >
      {isDragging ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-1 rounded-xl bg-muted opacity-100 shadow-[inset_0_1px_5px_0_rgba(0,0,0,0.1)]"
        />
      ) : null}
      <div
        className={cn(
          isDragging && "opacity-0",
          (item.typeCode === "memo" || item.typeCode === "map" || item.typeCode === "image" || item.typeCode === "video") &&
            "h-full min-h-0 overflow-hidden",
        )}
      >
        {itemActions ? <EditableItemActionControls item={item} itemActions={itemActions} /> : null}
        <ItemRenderer
          item={item}
          canEditMemo={Boolean(itemActions)}
          onMemoChange={onMemoChange}
          canEditLinkTitle={Boolean(itemActions)}
          onLinkTitleChange={onLinkTitleChange}
          onLinkTitleSubmit={onLinkTitleSubmit}
          canEditMap={Boolean(itemActions)}
          onMapSave={itemActions?.onMapSave}
        />
      </div>
    </article>
  );
}

function ItemList({
  items,
  withBottomSpacing = false,
  draftItem,
  draftState = null,
  dndContextId,
  itemActions,
  onMemoChange,
  onLinkTitleChange,
  onLinkTitleSubmit,
  onItemReorder,
}: ItemListProps) {
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const sortableItemIds = useMemo(() => itemIds, [itemIds]);
  const reorderEnabled = Boolean(itemActions) && Boolean(onItemReorder);
  const sensors = useSensors(useSensor(PageItemPointerSensor));
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const itemEntryMotionConfig = useMemo(() => buildItemEntryMotionConfig(shouldReduceMotion), [shouldReduceMotion]);
  const previousItemIdsRef = useRef<string[]>(itemIds);
  const previousDraftRef = useRef<{ exists: boolean; isSaving: boolean }>({
    exists: Boolean(draftState),
    isSaving: draftState?.isSaving ?? false,
  });
  const skippedItemEntryAnimationIdSet = useMemo(
    () =>
      new Set(
        resolveSkippedItemEntryAnimationIds({
          previousItemIds: previousItemIdsRef.current,
          nextItemIds: itemIds,
          previousDraft: previousDraftRef.current,
          nextDraftExists: Boolean(draftState),
        }),
      ),
    [itemIds, draftState],
  );

  useEffect(() => {
    previousItemIdsRef.current = itemIds;
    previousDraftRef.current = {
      exists: Boolean(draftState),
      isSaving: draftState?.isSaving ?? false,
    };
  }, [itemIds, draftState]);

  if (items.length === 0 && !draftItem) {
    return null;
  }

  const activeItem = activeItemId ? (items.find((item) => item.id === activeItemId) ?? null) : null;
  const ActiveItemRenderer = activeItem ? getPageItemRenderer(activeItem.typeCode) : null;
  const shouldAnimateItemResizeLayout = !shouldReduceMotion && !activeItemId;

  const handleDragStart = (event: DragStartEvent) => {
    if (!reorderEnabled) {
      return;
    }

    const nextActiveItemId = toItemId(event.active.id);

    if (!nextActiveItemId) {
      return;
    }

    setActiveItemId(nextActiveItemId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!reorderEnabled || !onItemReorder) {
      return;
    }

    const nextActiveItemId = toItemId(event.active.id);
    const nextOverItemId = toItemId(event.over?.id);

    if (nextActiveItemId && nextOverItemId && nextActiveItemId !== nextOverItemId) {
      onItemReorder(nextActiveItemId, nextOverItemId);
    }

    setActiveItemId(null);
  };

  const handleDragCancel = () => {
    setActiveItemId(null);
  };

  const renderItemCards = (isReorderEnabled: boolean) => {
    if (shouldReduceMotion) {
      return items.map((item) => (
        <SortableItemCard
          key={item.id}
          item={item}
          itemActions={itemActions}
          onMemoChange={onMemoChange}
          onLinkTitleChange={onLinkTitleChange}
          onLinkTitleSubmit={onLinkTitleSubmit}
          reorderEnabled={isReorderEnabled}
        />
      ));
    }

    return (
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const shouldSkipEntryAnimation = skippedItemEntryAnimationIdSet.has(item.id);

          return (
            <motion.div
              key={item.id}
              layout={shouldAnimateItemResizeLayout}
              initial={shouldSkipEntryAnimation ? false : itemEntryMotionConfig.initial}
              animate={itemEntryMotionConfig.animate}
              exit={itemEntryMotionConfig.exit}
              transition={{
                ...itemEntryMotionConfig.transition,
                layout: ITEM_RESIZE_LAYOUT_TRANSITION,
              }}
            >
              <SortableItemCard
                item={item}
                itemActions={itemActions}
                onMemoChange={onMemoChange}
                onLinkTitleChange={onLinkTitleChange}
                onLinkTitleSubmit={onLinkTitleSubmit}
                reorderEnabled={isReorderEnabled}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    );
  };

  const renderDraftCard = () => {
    if (!draftItem) {
      return null;
    }

    if (shouldReduceMotion) {
      return draftItem;
    }

    return (
      <motion.div
        initial={itemEntryMotionConfig.initial}
        animate={itemEntryMotionConfig.animate}
        transition={itemEntryMotionConfig.transition}
      >
        {draftItem}
      </motion.div>
    );
  };

  if (!reorderEnabled) {
    return (
      <div className={cn("flex flex-col gap-3", withBottomSpacing ? "pb-40" : undefined)}>
        {renderItemCards(false)}
        {renderDraftCard()}
      </div>
    );
  }

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortableItemIds} strategy={verticalListSortingStrategy}>
        <div className={cn("flex flex-col gap-3", withBottomSpacing ? "pb-40" : undefined)}>
          {renderItemCards(true)}
          {renderDraftCard()}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeItem && ActiveItemRenderer ? (
          <article className={cn(resolvePageItemCardClassName(activeItem), "floating-shadow scale-[1.03] bg-muted")}>
            <ActiveItemRenderer
              item={activeItem}
              canEditMemo={false}
              canEditLinkTitle={false}
              canEditMap={false}
              onMemoChange={undefined}
              onLinkTitleChange={undefined}
              onLinkTitleSubmit={undefined}
              onMapSave={undefined}
            />
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * 페이지 소유자가 전체 아이템을 확인하고 하단 작성 바를 통해 아이템을 추가하는 편집 섹션.
 */
export function EditablePageItemSection({ handle, initialItems = [], composerAppearDelayMs = 0 }: EditablePageItemSectionProps) {
  const controller = usePageItemComposer({
    handle,
    initialItems,
  });
  const isMobileViewport = useIsMobile();
  const isMobileWebRuntime = useIsMobileWebRuntime();
  const shouldHideComposerBar = isMobileViewport || isMobileWebRuntime;
  const ogController = useOgCrawl({
    onLookupStart: controller.handleOpenLinkDraft,
    onLookupError: controller.handleRemoveDraft,
    onLookupSuccess: controller.handleCreateLinkItemFromOg,
  });

  const draftItem = controller.draft ? (
    <DraftItemCard
      draft={controller.draft}
      focusRequestId={controller.focusRequestId}
      onDraftChange={controller.handleDraftChange}
      onDraftRemove={controller.handleRemoveDraft}
    />
  ) : null;
  const draftState = controller.draft
    ? {
        isSaving: controller.draft.isSaving,
      }
    : null;
  const itemActions: EditableItemActions = {
    onRemove: controller.handleRemoveItem,
    onResize: controller.handleItemResize,
    onMapSave: controller.handleUpdateMapItem,
  };

  return (
    <section className="flex flex-col gap-3 px-4 pb-12">
      <ItemList
        items={controller.items}
        withBottomSpacing={!shouldHideComposerBar}
        draftItem={draftItem}
        draftState={draftState}
        dndContextId={`page-item-sortable-${encodeURIComponent(handle)}`}
        itemActions={itemActions}
        onMemoChange={controller.handleItemMemoChange}
        onLinkTitleChange={controller.handleItemLinkTitleChange}
        onLinkTitleSubmit={controller.handleItemLinkTitleSubmit}
        onItemReorder={controller.handleItemReorder}
      />
      {shouldHideComposerBar ? null : (
        <ItemComposerBar
          hasDraft={Boolean(controller.draft)}
          onOpenComposer={controller.handleOpenComposer}
          ogController={ogController}
          onSaveMapItem={controller.handleCreateMapItem}
          onCreateMediaItemFromFile={controller.handleCreateMediaItemFromFile}
          appearDelayMs={composerAppearDelayMs}
        />
      )}
    </section>
  );
}
