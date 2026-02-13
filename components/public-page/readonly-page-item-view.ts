import { PAGE_ITEM_SIZE_CODES, type PageItemSizeCode } from "@/service/page/item-size";
import type { VisiblePageItem } from "@/service/page/items";

const DEFAULT_PAGE_ITEM_SIZE_CODE: PageItemSizeCode = "wide-short";
const WINDOWS_LINE_BREAK_PATTERN = /\r\n?/g;
const LINK_TITLE_LINE_BREAK_PATTERN = /\r?\n/g;

export const READONLY_PAGE_ITEM_FALLBACK_EMPTY_TEXT = "No content";
export const READONLY_PAGE_ITEM_FALLBACK_UNSUPPORTED_TEXT = "Unsupported data format";
export const READONLY_PAGE_ITEM_FALLBACK_FAVICON_SRC = "/no-favicon.png";

export type ReadonlyPageItem = Omit<VisiblePageItem, "sizeCode"> & {
  sizeCode: PageItemSizeCode;
};

type PageItemData = Record<string, unknown>;

function normalizePageItemSizeCode(value: unknown): PageItemSizeCode {
  if (typeof value !== "string") {
    return DEFAULT_PAGE_ITEM_SIZE_CODE;
  }

  return PAGE_ITEM_SIZE_CODES.includes(value as PageItemSizeCode) ? (value as PageItemSizeCode) : DEFAULT_PAGE_ITEM_SIZE_CODE;
}

function normalizeMemoContent(value: string) {
  return value.replace(WINDOWS_LINE_BREAK_PATTERN, "\n");
}

function normalizeLinkTitle(value: string) {
  return value.replace(LINK_TITLE_LINE_BREAK_PATTERN, " ");
}

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

/**
 * 서버에서 받은 아이템 목록을 읽기 전용 렌더링 전용 모델로 정규화한다.
 */
export function normalizeReadonlyPageItems(items: VisiblePageItem[]): ReadonlyPageItem[] {
  return [...items]
    .map((item) => ({
      ...item,
      sizeCode: normalizePageItemSizeCode(item.sizeCode),
    }))
    .sort((first, second) => first.orderKey - second.orderKey);
}

/**
 * memo 아이템 데이터에서 표시용 본문을 추출한다.
 */
export function resolveReadonlyMemoContent(item: ReadonlyPageItem) {
  const data = toObjectData(item.data);

  if (!data || typeof data.content !== "string") {
    return "";
  }

  return normalizeMemoContent(data.content);
}

/**
 * link 아이템 데이터에서 URL/제목/favicon을 읽기 전용 링크 모델로 추출한다.
 */
export function resolveReadonlyLinkView(item: ReadonlyPageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return {
      title: "",
      url: null,
      faviconSrc: READONLY_PAGE_ITEM_FALLBACK_FAVICON_SRC,
    };
  }

  const title = typeof data.title === "string" ? normalizeLinkTitle(data.title) : "";
  const url = typeof data.url === "string" && data.url.trim().length > 0 ? data.url.trim() : null;
  const faviconSrc =
    typeof data.favicon === "string" && data.favicon.trim().length > 0 ? data.favicon.trim() : READONLY_PAGE_ITEM_FALLBACK_FAVICON_SRC;

  return {
    title,
    url,
    faviconSrc,
  };
}

/**
 * 아이템 타입에 따라 읽기 전용 카드에서 표시할 대표 텍스트를 계산한다.
 */
export function resolveReadonlyPageItemDisplayText(item: ReadonlyPageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return READONLY_PAGE_ITEM_FALLBACK_EMPTY_TEXT;
  }

  if (item.typeCode === "memo") {
    return pickFirstText(data, ["content"]) ?? pickFirstPrimitiveText(data) ?? READONLY_PAGE_ITEM_FALLBACK_UNSUPPORTED_TEXT;
  }

  if (item.typeCode === "link") {
    return pickFirstText(data, ["title", "url"]) ?? pickFirstPrimitiveText(data) ?? READONLY_PAGE_ITEM_FALLBACK_UNSUPPORTED_TEXT;
  }

  if (item.typeCode === "image") {
    return (
      pickFirstText(data, ["alt", "caption", "title", "src"]) ??
      pickFirstPrimitiveText(data) ??
      READONLY_PAGE_ITEM_FALLBACK_UNSUPPORTED_TEXT
    );
  }

  return pickFirstPrimitiveText(data) ?? READONLY_PAGE_ITEM_FALLBACK_UNSUPPORTED_TEXT;
}
