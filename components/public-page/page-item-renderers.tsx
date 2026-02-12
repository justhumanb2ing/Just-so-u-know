"use client";

import type { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { type PageItem, resolveMemoItemContent } from "@/hooks/use-page-item-composer";

type PageItemRendererProps = {
  item: PageItem;
  canEditMemo?: boolean;
  onMemoChange?: (itemId: string, nextValue: string) => void;
};

type PageItemData = Record<string, unknown>;
type PageItemTextResolver = (data: PageItemData) => string;

export type PageItemRenderer = (props: PageItemRendererProps) => ReactNode;

const FALLBACK_EMPTY_TEXT = "No content";
const FALLBACK_UNSUPPORTED_TEXT = "Unsupported data format";

function toObjectData(data: unknown): PageItemData | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  return data as PageItemData;
}

function pickFirstText(data: PageItemData, keys: string[]) {
  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function pickFirstPrimitiveText(data: PageItemData) {
  for (const value of Object.values(data)) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }

  return null;
}

const PAGE_ITEM_TEXT_RESOLVER_MAP: Record<string, PageItemTextResolver> = {
  memo: (data) => pickFirstText(data, ["content"]) ?? pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT,
  link: (data) => pickFirstText(data, ["label", "title", "url"]) ?? pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT,
  image: (data) => pickFirstText(data, ["alt", "caption", "title", "src"]) ?? pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT,
};

/**
 * 아이템 타입에 따라 렌더링에 사용할 표시 텍스트를 계산한다.
 */
export function resolvePageItemDisplayText(item: PageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return FALLBACK_EMPTY_TEXT;
  }

  const resolveText = PAGE_ITEM_TEXT_RESOLVER_MAP[item.typeCode];

  if (resolveText) {
    return resolveText(data);
  }

  return pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT;
}

function MemoItemRenderer({ item, canEditMemo = false, onMemoChange }: PageItemRendererProps) {
  const isReadOnly = !canEditMemo || !onMemoChange;

  return (
    <Textarea
      value={resolveMemoItemContent(item)}
      readOnly={isReadOnly}
      onChange={(event) => onMemoChange?.(item.id, event.target.value)}
      className="scrollbar-hide wrap-break-word h-full min-h-0 w-full resize-none overflow-y-auto whitespace-pre-wrap rounded-sm border-0 p-2 text-base! leading-relaxed shadow-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-0"
    />
  );
}

function LinkItemRenderer({ item }: PageItemRendererProps) {
  return (
    <p className="wrap-break-word underline/20 line-clamp-2 h-fit w-full whitespace-pre-wrap text-base">
      {resolvePageItemDisplayText(item)}
    </p>
  );
}

function ImageItemRenderer({ item }: PageItemRendererProps) {
  return (
    <p className="wrap-break-word line-clamp-2 h-fit w-full whitespace-pre-wrap text-base italic">{resolvePageItemDisplayText(item)}</p>
  );
}

function DefaultItemRenderer({ item }: PageItemRendererProps) {
  return <p className="wrap-break-word line-clamp-2 h-fit w-full whitespace-pre-wrap text-base">{resolvePageItemDisplayText(item)}</p>;
}

const PAGE_ITEM_RENDERER_MAP: Record<string, PageItemRenderer> = {
  memo: MemoItemRenderer,
  link: LinkItemRenderer,
  image: ImageItemRenderer,
};

/**
 * 아이템 타입에 맞는 렌더러 컴포넌트를 반환한다.
 * 미지원 타입은 기본 렌더러를 사용한다.
 */
export function getPageItemRenderer(typeCode: string) {
  return PAGE_ITEM_RENDERER_MAP[typeCode] ?? DefaultItemRenderer;
}
