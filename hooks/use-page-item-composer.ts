"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTrackPageDbWrite } from "@/hooks/use-page-save-status";
import {
  isAllowedPageItemMediaFileSize,
  isAllowedPageItemMediaMimeType,
  PAGE_ITEM_MEDIA_MAX_FILE_SIZE_BYTES,
} from "@/service/page/item-media";
import { PAGE_ITEM_SIZE_CODES, type PageItemSizeCode } from "@/service/page/item-size";
import type { CrawlResponse } from "@/service/page/og-crawl";

export const ITEM_COMPOSER_AUTOSAVE_DEBOUNCE_MS = 800;
export const ITEM_REORDER_PERSIST_DEBOUNCE_MS = 120;
export const DEFAULT_PAGE_ITEM_SIZE_CODE: PageItemSizeCode = "wide-short";

const WINDOWS_LINE_BREAK_PATTERN = /\r\n?/g;
const LINK_TITLE_LINE_BREAK_PATTERN = /\r?\n/g;
const PAGE_ITEM_MEDIA_MAX_SIZE_MB = Math.floor(PAGE_ITEM_MEDIA_MAX_FILE_SIZE_BYTES / (1024 * 1024));

export type { PageItemSizeCode } from "@/service/page/item-size";

export type InitialPageItem = {
  id: string;
  typeCode: string;
  sizeCode: string;
  orderKey: number;
  data: unknown;
  createdAt: string;
  updatedAt: string;
};

export type PageItem = {
  id: string;
  typeCode: string;
  sizeCode: PageItemSizeCode;
  orderKey: number;
  data: unknown;
  createdAt: string;
  updatedAt: string;
};

type MemoDraftState = {
  id: string;
  kind: "memo";
  content: string;
  hasUserInput: boolean;
  isSaving: boolean;
};

type LinkDraftState = {
  id: string;
  kind: "link";
  content: string;
  hasUserInput: boolean;
  isSaving: boolean;
};

type MediaDraftState = {
  id: string;
  kind: "media";
  mediaType: "image" | "video";
  content: string;
  hasUserInput: boolean;
  isSaving: boolean;
};

type ItemDraftState = MemoDraftState | LinkDraftState | MediaDraftState;

type PersistedPageItemApiResponse = {
  status: "success";
  item: {
    id: string;
    typeCode: unknown;
    sizeCode: unknown;
    orderKey: unknown;
    data: unknown;
    createdAt: string;
    updatedAt: string;
  };
};

type ErrorApiResponse = {
  status: "error";
  message: string;
};

type InitPageItemMediaUploadApiSuccess = {
  status: "success";
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  objectKey: string;
  mediaType: "image" | "video";
  mimeType: string;
  fileName: string;
  fileSize: number;
};

type CompletePageItemMediaUploadApiSuccess = {
  status: "success";
  media: {
    type: "image" | "video";
    src: string;
    mimeType: string;
    fileName: string;
    fileSize: number;
    objectKey: string;
  };
};

export type PageItemComposerController = {
  draft: ItemDraftState | null;
  items: PageItem[];
  focusRequestId: number;
  handleOpenComposer: () => void;
  handleOpenLinkDraft: () => void;
  handleDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleRemoveDraft: () => void;
  handleCreateLinkItemFromOg: (crawlResponse: CrawlResponse) => Promise<boolean>;
  handleCreateMapItem: (payload: MapItemCreatePayload) => Promise<boolean>;
  handleCreateMediaItemFromFile: (file: File) => Promise<boolean>;
  handleUpdateMapItem: (itemId: string, payload: MapItemCreatePayload) => Promise<boolean>;
  handleItemMemoChange: (itemId: string, nextValue: string) => void;
  handleItemLinkTitleChange: (itemId: string, nextValue: string) => void;
  handleItemLinkTitleSubmit: (itemId: string) => void;
  handleItemResize: (itemId: string, nextSizeCode: PageItemSizeCode) => void;
  handleItemReorder: (activeItemId: string, overItemId: string) => void;
  handleRemoveItem: (itemId: string) => void;
};

export type UsePageItemComposerParams = {
  handle: string;
  initialItems?: InitialPageItem[];
};

type LinkItemCreatePayload = {
  url: string;
  title: string;
  favicon: string | null;
};

type MediaItemCreatePayload = {
  type: "image" | "video";
  src: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  objectKey: string;
};

export type MapItemCreatePayload = {
  lat: number;
  lng: number;
  zoom: number;
  caption?: string;
  googleMapUrl: string;
};

export type MapItemView = {
  lat: number;
  lng: number;
  zoom: number;
  caption: string;
  googleMapUrl: string;
};

async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse | null> {
  try {
    return (await response.json()) as TResponse;
  } catch {
    return null;
  }
}

/**
 * 저장 성공한 draft는 목록 반영 후 화면에서 제거한다.
 */
export function resolveDraftAfterPersistSuccess(prevDraft: ItemDraftState | null, persistedDraftId: string) {
  if (!prevDraft || prevDraft.id !== persistedDraftId) {
    return prevDraft;
  }

  return null;
}

function createDraftId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `page-item-draft-${Date.now()}`;
}

/**
 * textarea 입력의 줄바꿈을 `\n` 형식으로 정규화한다.
 */
export function normalizeItemInput(value: string) {
  return value.replace(WINDOWS_LINE_BREAK_PATTERN, "\n");
}

/**
 * 링크 title 입력을 단일 라인으로 정규화한다.
 */
export function normalizeLinkTitleInput(value: string) {
  return value.replace(LINK_TITLE_LINE_BREAK_PATTERN, " ");
}

/**
 * 저장 가능한 유효 텍스트가 있는지 판단한다.
 */
export function hasMeaningfulItemContent(value: string) {
  return value.trim().length > 0;
}

/**
 * API 응답 sizeCode를 허용 가능한 아이템 크기 코드로 정규화한다.
 */
export function normalizePageItemSizeCode(value: unknown): PageItemSizeCode {
  if (typeof value !== "string") {
    return DEFAULT_PAGE_ITEM_SIZE_CODE;
  }

  return PAGE_ITEM_SIZE_CODES.includes(value as PageItemSizeCode) ? (value as PageItemSizeCode) : DEFAULT_PAGE_ITEM_SIZE_CODE;
}

/**
 * 저장용 페이지 아이템 API 엔드포인트를 생성한다.
 */
export function buildPageItemsEndpoint(handle: string) {
  return `/api/pages/${encodeURIComponent(handle)}/items`;
}

/**
 * 페이지 아이템 단건 수정용 API 엔드포인트를 생성한다.
 */
export function buildPageItemEndpoint(handle: string, itemId: string) {
  return `/api/pages/${encodeURIComponent(handle)}/items/${encodeURIComponent(itemId)}`;
}

/**
 * 페이지 아이템 순서 일괄 저장 API 엔드포인트를 생성한다.
 */
export function buildPageItemsReorderEndpoint(handle: string) {
  return `/api/pages/${encodeURIComponent(handle)}/items/reorder`;
}

/**
 * 페이지 아이템 미디어 presigned URL 발급 API 엔드포인트를 반환한다.
 */
export function buildPageItemMediaInitUploadEndpoint() {
  return "/api/page/item-media/init-upload";
}

/**
 * 페이지 아이템 미디어 업로드 완료 검증 API 엔드포인트를 반환한다.
 */
export function buildPageItemMediaCompleteUploadEndpoint() {
  return "/api/page/item-media/complete-upload";
}

function sortPageItems(items: PageItem[]) {
  return [...items].sort((a, b) => a.orderKey - b.orderKey);
}

function resolvePageItemIds(items: PageItem[]) {
  return items.map((item) => item.id);
}

function hasSamePageItemIdOrder(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

/**
 * 아이템 배열 순서를 기준으로 orderKey를 1..N으로 다시 매긴다.
 */
export function renumberPageItemOrder(items: PageItem[]) {
  return items.map((item, index) => ({
    ...item,
    orderKey: index + 1,
  }));
}

/**
 * 아이템 id 배열 기준으로 목록 순서를 재배치하고 orderKey를 다시 매긴다.
 */
export function applyPageItemOrder(items: PageItem[], orderedItemIds: string[]) {
  if (items.length !== orderedItemIds.length) {
    return items;
  }

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const orderedItems: PageItem[] = [];

  for (const itemId of orderedItemIds) {
    const item = itemMap.get(itemId);

    if (!item) {
      return items;
    }

    orderedItems.push(item);
  }

  return renumberPageItemOrder(orderedItems);
}

/**
 * active/over 아이템 기준으로 목록 순서를 이동하고 orderKey를 다시 매긴다.
 */
export function reorderPageItemsById(items: PageItem[], activeItemId: string, overItemId: string) {
  if (activeItemId === overItemId) {
    return items;
  }

  const activeIndex = items.findIndex((item) => item.id === activeItemId);
  const overIndex = items.findIndex((item) => item.id === overItemId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(activeIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(overIndex, 0, movedItem);

  return renumberPageItemOrder(nextItems);
}

function toObjectData(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  return data as Record<string, unknown>;
}

/**
 * memo 아이템 데이터에서 content를 추출한다.
 */
export function resolveMemoItemContent(item: PageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return "";
  }
  const content = data.content;

  if (typeof content !== "string") {
    return "";
  }

  return normalizeItemInput(content);
}

/**
 * link 아이템 데이터에서 title을 추출한다.
 */
export function resolveLinkItemTitle(item: PageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return "";
  }

  const title = data.title;

  if (typeof title !== "string") {
    return "";
  }

  return normalizeLinkTitleInput(title);
}

/**
 * link 아이템 데이터에서 URL을 추출한다.
 */
export function resolveLinkItemUrl(item: PageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return null;
  }

  const url = data.url;

  return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
}

/**
 * link 아이템 데이터에서 favicon URL을 추출한다.
 */
export function resolveLinkItemFavicon(item: PageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return null;
  }

  const favicon = data.favicon;

  return typeof favicon === "string" && favicon.trim().length > 0 ? favicon.trim() : null;
}

/**
 * image/video 아이템 데이터에서 media src URL을 추출한다.
 */
export function resolveMediaItemSrc(item: PageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return null;
  }

  const src = data.src;

  return typeof src === "string" && src.trim().length > 0 ? src.trim() : null;
}

/**
 * image/video 아이템 데이터에서 MIME 타입을 추출한다.
 */
export function resolveMediaItemMimeType(item: PageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return null;
  }

  const mimeType = data.mimeType;

  return typeof mimeType === "string" && mimeType.trim().length > 0 ? mimeType.trim().toLowerCase() : null;
}

function resolveFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

/**
 * 좌표/줌 정보를 기반으로 Google Maps URL을 생성한다.
 */
export function buildGoogleMapUrl(lat: number, lng: number, zoom: number) {
  const endpoint = new URL("https://www.google.com/maps");
  endpoint.searchParams.set("q", `${lat.toFixed(6)},${lng.toFixed(6)}`);
  endpoint.searchParams.set("z", zoom.toFixed(2));
  return endpoint.toString();
}

/**
 * map 아이템 데이터에서 좌표/줌/캡션/구글맵 링크를 추출한다.
 */
export function resolveMapItemView(item: PageItem): MapItemView | null {
  const data = toObjectData(item.data);

  if (!data) {
    return null;
  }

  const lat = resolveFiniteNumber(data.lat);
  const lng = resolveFiniteNumber(data.lng);
  const zoom = resolveFiniteNumber(data.zoom);

  if (lat === null || lng === null || zoom === null) {
    return null;
  }

  const caption = typeof data.caption === "string" ? normalizeLinkTitleInput(data.caption).trim() : "";
  const rawGoogleMapUrl = typeof data.googleMapUrl === "string" ? data.googleMapUrl.trim() : "";
  const fallbackGoogleMapUrl = buildGoogleMapUrl(lat, lng, zoom);

  if (!rawGoogleMapUrl) {
    return {
      lat,
      lng,
      zoom,
      caption,
      googleMapUrl: fallbackGoogleMapUrl,
    };
  }

  try {
    const parsedGoogleMapUrl = new URL(rawGoogleMapUrl);
    const isValidProtocol = parsedGoogleMapUrl.protocol === "http:" || parsedGoogleMapUrl.protocol === "https:";

    return {
      lat,
      lng,
      zoom,
      caption,
      googleMapUrl: isValidProtocol ? parsedGoogleMapUrl.toString() : fallbackGoogleMapUrl,
    };
  } catch {
    return {
      lat,
      lng,
      zoom,
      caption,
      googleMapUrl: fallbackGoogleMapUrl,
    };
  }
}

/**
 * memo data에 content를 주입한 새 객체를 반환한다.
 */
function mergeMemoItemDataContent(data: unknown, content: string) {
  const nextData = toObjectData(data) ?? {};
  return {
    ...nextData,
    content,
  };
}

/**
 * link data에 title을 주입한 새 객체를 반환한다.
 */
function mergeLinkItemDataTitle(data: unknown, title: string) {
  const nextData = toObjectData(data) ?? {};
  return {
    ...nextData,
    title,
  };
}

/**
 * map data에 좌표/줌/캡션/구글맵 링크를 주입한 새 객체를 반환한다.
 */
function mergeMapItemData(data: unknown, payload: MapItemCreatePayload) {
  const nextData = toObjectData(data) ?? {};
  return {
    ...nextData,
    lat: payload.lat,
    lng: payload.lng,
    zoom: payload.zoom,
    caption: payload.caption,
    googleMapUrl: payload.googleMapUrl,
  };
}

/**
 * 아이템 목록에서 특정 memo 아이템의 content를 낙관적으로 갱신한다.
 */
export function updateMemoItemContent(items: PageItem[], itemId: string, content: string) {
  let hasChanged = false;

  const nextItems = items.map((item) => {
    if (item.id !== itemId || item.typeCode !== "memo") {
      return item;
    }

    if (resolveMemoItemContent(item) === content) {
      return item;
    }

    hasChanged = true;

    return {
      ...item,
      data: mergeMemoItemDataContent(item.data, content),
    };
  });

  return hasChanged ? nextItems : items;
}

/**
 * 아이템 목록에서 특정 link 아이템의 title을 낙관적으로 갱신한다.
 */
export function updateLinkItemTitle(items: PageItem[], itemId: string, title: string) {
  let hasChanged = false;

  const nextItems = items.map((item) => {
    if (item.id !== itemId || item.typeCode !== "link") {
      return item;
    }

    if (resolveLinkItemTitle(item) === title) {
      return item;
    }

    hasChanged = true;

    return {
      ...item,
      data: mergeLinkItemDataTitle(item.data, title),
    };
  });

  return hasChanged ? nextItems : items;
}

/**
 * 아이템 목록에서 특정 map 아이템의 좌표/줌/캡션/링크를 낙관적으로 갱신한다.
 */
export function updateMapItemData(items: PageItem[], itemId: string, payload: MapItemCreatePayload) {
  let hasChanged = false;

  const nextItems = items.map((item) => {
    if (item.id !== itemId || item.typeCode !== "map") {
      return item;
    }

    const currentMapView = resolveMapItemView(item);

    if (
      currentMapView &&
      currentMapView.lat === payload.lat &&
      currentMapView.lng === payload.lng &&
      currentMapView.zoom === payload.zoom &&
      currentMapView.caption === payload.caption &&
      currentMapView.googleMapUrl === payload.googleMapUrl
    ) {
      return item;
    }

    hasChanged = true;

    return {
      ...item,
      data: mergeMapItemData(item.data, payload),
    };
  });

  return hasChanged ? nextItems : items;
}

/**
 * 아이템 목록에서 특정 아이템의 sizeCode를 낙관적으로 갱신한다.
 */
export function updatePageItemSize(items: PageItem[], itemId: string, nextSizeCode: PageItemSizeCode) {
  let hasChanged = false;

  const nextItems = items.map((item) => {
    if (item.id !== itemId || item.sizeCode === nextSizeCode) {
      return item;
    }

    hasChanged = true;

    return {
      ...item,
      sizeCode: nextSizeCode,
    };
  });

  return hasChanged ? nextItems : items;
}

/**
 * 아이템 목록에서 특정 아이템을 제거하고 제거된 항목을 함께 반환한다.
 */
export function removePageItemById(
  items: PageItem[],
  itemId: string,
): {
  nextItems: PageItem[];
  removedItem: PageItem | null;
} {
  let removedItem: PageItem | null = null;

  const nextItems = items.filter((item) => {
    if (item.id !== itemId) {
      return true;
    }

    removedItem = item;
    return false;
  });

  return {
    nextItems,
    removedItem,
  };
}

/**
 * 삭제 실패 시 제거했던 아이템을 정렬 기준으로 복구한다.
 */
export function restoreRemovedPageItem(items: PageItem[], removedItem: PageItem | null) {
  if (!removedItem) {
    return items;
  }

  if (items.some((item) => item.id === removedItem.id)) {
    return items;
  }

  return sortPageItems([...items, removedItem]);
}

/**
 * 서버에서 주입된 아이템 목록을 클라이언트 렌더링 타입으로 정규화한다.
 */
export function normalizeInitialPageItems(items: InitialPageItem[]): PageItem[] {
  return sortPageItems(
    items.map((item) => ({
      ...item,
      sizeCode: normalizePageItemSizeCode(item.sizeCode),
    })),
  );
}

/**
 * 생성 API 응답을 아이템 렌더링 모델로 정규화한다.
 */
export function normalizeCreatedItem(item: PersistedPageItemApiResponse["item"]): PageItem {
  return {
    id: item.id,
    typeCode: typeof item.typeCode === "string" ? item.typeCode : "memo",
    sizeCode: normalizePageItemSizeCode(item.sizeCode),
    orderKey: typeof item.orderKey === "number" && Number.isFinite(item.orderKey) ? item.orderKey : Number.MAX_SAFE_INTEGER,
    data: item.data,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * OG 조회 결과를 링크 아이템 생성 payload로 정규화한다.
 * 저장 기준 URL은 `data.url`만 사용한다.
 */
export function resolveLinkItemCreatePayloadFromCrawl(crawlResponse: CrawlResponse): LinkItemCreatePayload | null {
  const rawUrl = crawlResponse.data.url;
  const rawTitle = crawlResponse.data.title;
  const rawFavicon = crawlResponse.data.favicon;

  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return null;
  }

  let normalizedUrl: string;

  try {
    const parsed = new URL(rawUrl.trim());

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    normalizedUrl = parsed.toString();
  } catch {
    return null;
  }

  if (typeof rawTitle !== "string") {
    return null;
  }

  const normalizedTitle = normalizeLinkTitleInput(rawTitle).trim();

  if (!hasMeaningfulItemContent(normalizedTitle)) {
    return null;
  }

  let normalizedFavicon: string | null = null;

  if (typeof rawFavicon === "string" && rawFavicon.trim().length > 0) {
    try {
      const parsedFavicon = new URL(rawFavicon.trim());

      normalizedFavicon = parsedFavicon.protocol === "http:" || parsedFavicon.protocol === "https:" ? parsedFavicon.toString() : null;
    } catch {
      normalizedFavicon = null;
    }
  }

  return {
    url: normalizedUrl,
    title: normalizedTitle,
    favicon: normalizedFavicon,
  };
}

/**
 * memo/link 타입 생성과 아이템 수정/삭제를 관리한다.
 */
export function usePageItemComposer({ handle, initialItems = [] }: UsePageItemComposerParams): PageItemComposerController {
  const normalizedInitialItemsRef = useRef<PageItem[] | null>(null);

  if (!normalizedInitialItemsRef.current) {
    normalizedInitialItemsRef.current = normalizeInitialPageItems(initialItems);
  }

  const [draft, setDraft] = useState<ItemDraftState | null>(null);
  const [items, setItems] = useState<PageItem[]>(() => normalizedInitialItemsRef.current ?? []);
  const [focusRequestId, setFocusRequestId] = useState(0);
  const trackPageDbWrite = useTrackPageDbWrite();
  const draftRef = useRef<ItemDraftState | null>(null);
  const itemsRef = useRef<PageItem[]>(items);
  const memoSaveTimerMapRef = useRef<Map<string, number>>(new Map());
  const memoPersistInFlightIdsRef = useRef<Set<string>>(new Set());
  const memoPersistQueuedIdsRef = useRef<Set<string>>(new Set());
  const linkTitleSaveTimerMapRef = useRef<Map<string, number>>(new Map());
  const linkTitlePersistInFlightIdsRef = useRef<Set<string>>(new Set());
  const linkTitlePersistQueuedIdsRef = useRef<Set<string>>(new Set());
  const itemSizePersistInFlightIdsRef = useRef<Set<string>>(new Set());
  const itemSizePersistQueuedIdsRef = useRef<Set<string>>(new Set());
  const itemOrderPersistTimerRef = useRef<number | null>(null);
  const itemOrderPersistInFlightRef = useRef(false);
  const itemOrderPersistQueuedRef = useRef(false);
  const itemLastSyncedSizeCodeMapRef = useRef<Map<string, PageItemSizeCode>>(
    new Map((normalizedInitialItemsRef.current ?? []).map((item) => [item.id, item.sizeCode])),
  );
  const itemLastSyncedOrderIdsRef = useRef<string[]>(resolvePageItemIds(normalizedInitialItemsRef.current ?? []));
  const itemDeleteInFlightIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const timerId of memoSaveTimerMapRef.current.values()) {
        window.clearTimeout(timerId);
      }

      for (const timerId of linkTitleSaveTimerMapRef.current.values()) {
        window.clearTimeout(timerId);
      }

      if (itemOrderPersistTimerRef.current) {
        window.clearTimeout(itemOrderPersistTimerRef.current);
      }

      memoSaveTimerMapRef.current.clear();
      memoPersistInFlightIdsRef.current.clear();
      memoPersistQueuedIdsRef.current.clear();
      linkTitleSaveTimerMapRef.current.clear();
      linkTitlePersistInFlightIdsRef.current.clear();
      linkTitlePersistQueuedIdsRef.current.clear();
      itemSizePersistInFlightIdsRef.current.clear();
      itemSizePersistQueuedIdsRef.current.clear();
      itemOrderPersistInFlightRef.current = false;
      itemOrderPersistQueuedRef.current = false;
      itemOrderPersistTimerRef.current = null;
      itemLastSyncedSizeCodeMapRef.current.clear();
      itemLastSyncedOrderIdsRef.current = [];
      itemDeleteInFlightIdsRef.current.clear();
    };
  }, []);

  const persistDraft = useCallback(async () => {
    const currentDraft = draftRef.current;

    if (!currentDraft || currentDraft.kind !== "memo" || currentDraft.isSaving) {
      return;
    }

    if (!hasMeaningfulItemContent(currentDraft.content)) {
      return;
    }

    setDraft((prevDraft) => {
      if (!prevDraft || prevDraft.kind !== "memo" || prevDraft.id !== currentDraft.id) {
        return prevDraft;
      }

      return {
        ...prevDraft,
        isSaving: true,
      };
    });

    try {
      const payload = await trackPageDbWrite(async () => {
        const response = await fetch(buildPageItemsEndpoint(handle), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "memo",
            data: {
              content: currentDraft.content,
            },
          }),
        });

        const payload = (await response.json()) as PersistedPageItemApiResponse | ErrorApiResponse;

        if (!response.ok || payload.status !== "success") {
          throw new Error(payload.status === "error" ? payload.message : "Failed to create item.");
        }

        return payload;
      });

      const createdItem = normalizeCreatedItem(payload.item);
      itemLastSyncedSizeCodeMapRef.current.set(createdItem.id, createdItem.sizeCode);

      setItems((prevItems) => {
        const nextItems = sortPageItems([...prevItems, createdItem]);
        itemLastSyncedOrderIdsRef.current = resolvePageItemIds(nextItems);
        return nextItems;
      });
      setDraft((prevDraft) => resolveDraftAfterPersistSuccess(prevDraft, currentDraft.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create item.";

      setDraft((prevDraft) => {
        if (!prevDraft || prevDraft.kind !== "memo" || prevDraft.id !== currentDraft.id) {
          return prevDraft;
        }

        return {
          ...prevDraft,
          isSaving: false,
          hasUserInput: false,
        };
      });
      toast.error("Failed to save item", {
        description: message,
      });
    }
  }, [handle, trackPageDbWrite]);

  /**
   * OG 조회 결과를 기반으로 link 아이템을 생성한다.
   */
  const handleCreateLinkItemFromOg = useCallback(
    async (crawlResponse: CrawlResponse) => {
      const linkPayload = resolveLinkItemCreatePayloadFromCrawl(crawlResponse);

      if (!linkPayload) {
        setDraft((prevDraft) => (prevDraft?.kind === "link" ? null : prevDraft));
        toast.error("Failed to save item", {
          description: "Link title and URL are required.",
        });
        return false;
      }

      try {
        const payload = await trackPageDbWrite(async () => {
          const response = await fetch(buildPageItemsEndpoint(handle), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "link",
              data: {
                url: linkPayload.url,
                title: linkPayload.title,
                favicon: linkPayload.favicon,
              },
            }),
          });

          const payload = (await response.json()) as PersistedPageItemApiResponse | ErrorApiResponse;

          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.status === "error" ? payload.message : "Failed to create item.");
          }

          return payload;
        });

        const createdItem = normalizeCreatedItem(payload.item);
        itemLastSyncedSizeCodeMapRef.current.set(createdItem.id, createdItem.sizeCode);
        setItems((prevItems) => {
          const nextItems = sortPageItems([...prevItems, createdItem]);
          itemLastSyncedOrderIdsRef.current = resolvePageItemIds(nextItems);
          return nextItems;
        });
        setDraft((prevDraft) => (prevDraft?.kind === "link" ? null : prevDraft));

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create item.";
        setDraft((prevDraft) => (prevDraft?.kind === "link" ? null : prevDraft));

        toast.error("Failed to save item", {
          description: message,
        });
        return false;
      }
    },
    [handle, trackPageDbWrite],
  );

  /**
   * 지도 선택 결과를 map 아이템으로 생성한다.
   */
  const handleCreateMapItem = useCallback(
    async (mapPayload: MapItemCreatePayload) => {
      try {
        const payload = await trackPageDbWrite(async () => {
          const response = await fetch(buildPageItemsEndpoint(handle), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "map",
              data: {
                lat: mapPayload.lat,
                lng: mapPayload.lng,
                zoom: mapPayload.zoom,
                caption: normalizeLinkTitleInput(mapPayload.caption ?? "").trim(),
                googleMapUrl: mapPayload.googleMapUrl,
              },
            }),
          });

          const payload = (await response.json()) as PersistedPageItemApiResponse | ErrorApiResponse;

          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.status === "error" ? payload.message : "Failed to create item.");
          }

          return payload;
        });

        const createdItem = normalizeCreatedItem(payload.item);
        itemLastSyncedSizeCodeMapRef.current.set(createdItem.id, createdItem.sizeCode);
        setItems((prevItems) => {
          const nextItems = sortPageItems([...prevItems, createdItem]);
          itemLastSyncedOrderIdsRef.current = resolvePageItemIds(nextItems);
          return nextItems;
        });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create item.";

        toast.error("Failed to save item", {
          description: message,
        });
        return false;
      }
    },
    [handle, trackPageDbWrite],
  );

  /**
   * 업로드 완료된 image/video 메타데이터로 아이템을 생성한다.
   */
  const handleCreateMediaItem = useCallback(
    async (mediaPayload: MediaItemCreatePayload) => {
      try {
        const payload = await trackPageDbWrite(async () => {
          const response = await fetch(buildPageItemsEndpoint(handle), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: mediaPayload.type,
              data: {
                src: mediaPayload.src,
                mimeType: mediaPayload.mimeType,
                fileName: mediaPayload.fileName,
                fileSize: mediaPayload.fileSize,
                objectKey: mediaPayload.objectKey,
              },
            }),
          });

          const payload = (await response.json()) as PersistedPageItemApiResponse | ErrorApiResponse;

          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.status === "error" ? payload.message : "Failed to create item.");
          }

          return payload;
        });

        const createdItem = normalizeCreatedItem(payload.item);
        itemLastSyncedSizeCodeMapRef.current.set(createdItem.id, createdItem.sizeCode);
        setItems((prevItems) => {
          const nextItems = sortPageItems([...prevItems, createdItem]);
          itemLastSyncedOrderIdsRef.current = resolvePageItemIds(nextItems);
          return nextItems;
        });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create item.";

        toast.error("Failed to save item", {
          description: message,
        });
        return false;
      }
    },
    [handle, trackPageDbWrite],
  );

  /**
   * 파일 선택부터 presigned 업로드/완료 검증/아이템 생성까지 처리한다.
   */
  const handleCreateMediaItemFromFile = useCallback(
    async (file: File) => {
      const normalizedMimeType = file.type.trim().toLowerCase();
      const normalizedFileName = file.name.trim() || "upload-file";
      const mediaType = normalizedMimeType.startsWith("video/") ? "video" : "image";

      if (!isAllowedPageItemMediaMimeType(normalizedMimeType)) {
        toast.error("Unsupported media format", {
          description: "Please upload JPEG, PNG, WebP, GIF, MP4, or WebM files.",
        });
        return false;
      }

      if (!isAllowedPageItemMediaFileSize(file.size)) {
        toast.error("Media file is too large", {
          description: `Please upload media up to ${PAGE_ITEM_MEDIA_MAX_SIZE_MB}MB.`,
        });
        return false;
      }

      setDraft((prevDraft) => {
        if (prevDraft?.kind === "memo" && hasMeaningfulItemContent(prevDraft.content)) {
          return prevDraft;
        }

        return {
          id: createDraftId(),
          kind: "media",
          mediaType,
          content: "",
          hasUserInput: false,
          isSaving: true,
        };
      });

      try {
        const initResponse = await fetch(buildPageItemMediaInitUploadEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            handle,
            mimeType: normalizedMimeType,
            fileSize: file.size,
            fileName: normalizedFileName,
          }),
        });
        const initPayload = await parseJsonResponse<InitPageItemMediaUploadApiSuccess | ErrorApiResponse>(initResponse);

        if (!initResponse.ok || !initPayload || initPayload.status !== "success") {
          throw new Error(initPayload?.status === "error" ? initPayload.message : "Failed to initialize media upload.");
        }

        const uploadResponse = await fetch(initPayload.uploadUrl, {
          method: "PUT",
          headers: initPayload.uploadHeaders,
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload media.");
        }

        const completeResponse = await fetch(buildPageItemMediaCompleteUploadEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            handle,
            objectKey: initPayload.objectKey,
            mimeType: initPayload.mimeType,
            fileSize: initPayload.fileSize,
            fileName: initPayload.fileName,
          }),
        });
        const completePayload = await parseJsonResponse<CompletePageItemMediaUploadApiSuccess | ErrorApiResponse>(completeResponse);

        if (!completeResponse.ok || !completePayload || completePayload.status !== "success") {
          throw new Error(completePayload?.status === "error" ? completePayload.message : "Failed to complete media upload.");
        }

        const hasCreated = await handleCreateMediaItem({
          type: completePayload.media.type,
          src: completePayload.media.src,
          mimeType: completePayload.media.mimeType,
          fileName: completePayload.media.fileName,
          fileSize: completePayload.media.fileSize,
          objectKey: completePayload.media.objectKey,
        });

        setDraft((prevDraft) => (prevDraft?.kind === "media" ? null : prevDraft));

        return hasCreated;
      } catch (error) {
        setDraft((prevDraft) => (prevDraft?.kind === "media" ? null : prevDraft));
        toast.error("Failed to upload media", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
        return false;
      }
    },
    [handle, handleCreateMediaItem],
  );

  /**
   * 기존 map 아이템의 좌표/줌/캡션/링크를 서버에 저장한다.
   */
  const handleUpdateMapItem = useCallback(
    async (itemId: string, mapPayload: MapItemCreatePayload) => {
      const targetItem = itemsRef.current.find((item) => item.id === itemId);

      if (!targetItem || targetItem.typeCode !== "map") {
        return false;
      }

      const normalizedPayload: MapItemCreatePayload = {
        lat: mapPayload.lat,
        lng: mapPayload.lng,
        zoom: mapPayload.zoom,
        caption: normalizeLinkTitleInput(mapPayload.caption ?? "").trim(),
        googleMapUrl: mapPayload.googleMapUrl.trim() || buildGoogleMapUrl(mapPayload.lat, mapPayload.lng, mapPayload.zoom),
      };
      const previousMapItem = targetItem;

      setItems((prevItems) => updateMapItemData(prevItems, itemId, normalizedPayload));

      try {
        const payload = await trackPageDbWrite(async () => {
          const response = await fetch(buildPageItemEndpoint(handle, itemId), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "map",
              data: {
                lat: normalizedPayload.lat,
                lng: normalizedPayload.lng,
                zoom: normalizedPayload.zoom,
                caption: normalizedPayload.caption,
                googleMapUrl: normalizedPayload.googleMapUrl,
              },
            }),
          });

          const payload = (await response.json()) as PersistedPageItemApiResponse | ErrorApiResponse;

          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.status === "error" ? payload.message : "Failed to update item.");
          }

          return payload;
        });

        const updatedItem = normalizeCreatedItem(payload.item);

        setItems((prevItems) =>
          prevItems.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              data: updatedItem.data,
              updatedAt: updatedItem.updatedAt,
            };
          }),
        );

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update item.";

        setItems((prevItems) =>
          prevItems.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return previousMapItem;
          }),
        );

        toast.error("Failed to update item", {
          description: message,
        });
        return false;
      }
    },
    [handle, trackPageDbWrite],
  );

  useEffect(() => {
    if (!draft || draft.kind !== "memo" || draft.isSaving || !draft.hasUserInput) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistDraft();
    }, ITEM_COMPOSER_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, persistDraft]);

  const persistItemMemo = useCallback(
    async (itemId: string) => {
      if (memoPersistInFlightIdsRef.current.has(itemId)) {
        memoPersistQueuedIdsRef.current.add(itemId);
        return;
      }

      const targetItem = itemsRef.current.find((item) => item.id === itemId);

      if (!targetItem || targetItem.typeCode !== "memo") {
        return;
      }

      const content = resolveMemoItemContent(targetItem);

      if (!hasMeaningfulItemContent(content)) {
        return;
      }

      memoPersistInFlightIdsRef.current.add(itemId);

      try {
        const payload = await trackPageDbWrite(async () => {
          const response = await fetch(buildPageItemEndpoint(handle, itemId), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "memo",
              data: {
                content,
              },
            }),
          });

          const payload = (await response.json()) as PersistedPageItemApiResponse | ErrorApiResponse;

          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.status === "error" ? payload.message : "Failed to update item.");
          }

          return payload;
        });

        const updatedItem = normalizeCreatedItem(payload.item);

        setItems((prevItems) =>
          prevItems.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              updatedAt: updatedItem.updatedAt,
            };
          }),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update item.";

        toast.error("Failed to update item", {
          description: message,
        });
      } finally {
        memoPersistInFlightIdsRef.current.delete(itemId);

        if (memoPersistQueuedIdsRef.current.has(itemId)) {
          memoPersistQueuedIdsRef.current.delete(itemId);
          void persistItemMemo(itemId);
        }
      }
    },
    [handle, trackPageDbWrite],
  );

  /**
   * link 아이템 title을 서버에 저장한다.
   * 동일 아이템은 단일 in-flight 요청만 허용하고, 중복 요청은 마지막 상태로 재실행한다.
   */
  const persistItemLinkTitle = useCallback(
    async (itemId: string) => {
      if (linkTitlePersistInFlightIdsRef.current.has(itemId)) {
        linkTitlePersistQueuedIdsRef.current.add(itemId);
        return;
      }

      const targetItem = itemsRef.current.find((item) => item.id === itemId);

      if (!targetItem || targetItem.typeCode !== "link") {
        return;
      }

      const title = resolveLinkItemTitle(targetItem);

      if (!hasMeaningfulItemContent(title)) {
        return;
      }

      linkTitlePersistInFlightIdsRef.current.add(itemId);

      try {
        const payload = await trackPageDbWrite(async () => {
          const response = await fetch(buildPageItemEndpoint(handle, itemId), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "link",
              data: {
                title,
              },
            }),
          });

          const payload = (await response.json()) as PersistedPageItemApiResponse | ErrorApiResponse;

          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.status === "error" ? payload.message : "Failed to update item.");
          }

          return payload;
        });

        const updatedItem = normalizeCreatedItem(payload.item);

        setItems((prevItems) =>
          prevItems.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              data: updatedItem.data,
              updatedAt: updatedItem.updatedAt,
            };
          }),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update item.";

        toast.error("Failed to update item", {
          description: message,
        });
      } finally {
        linkTitlePersistInFlightIdsRef.current.delete(itemId);

        if (linkTitlePersistQueuedIdsRef.current.has(itemId)) {
          linkTitlePersistQueuedIdsRef.current.delete(itemId);
          void persistItemLinkTitle(itemId);
        }
      }
    },
    [handle, trackPageDbWrite],
  );

  /**
   * 아이템 사이즈를 서버에 저장한다.
   * 동일 아이템은 단일 in-flight 요청만 허용하고, 중복 요청은 마지막 상태로 재실행한다.
   */
  const persistItemSize = useCallback(
    async (itemId: string, explicitSizeCode?: PageItemSizeCode) => {
      if (itemSizePersistInFlightIdsRef.current.has(itemId)) {
        itemSizePersistQueuedIdsRef.current.add(itemId);
        return;
      }

      const targetItem = itemsRef.current.find((item) => item.id === itemId);

      if (!targetItem) {
        return;
      }

      const targetSizeCode = explicitSizeCode ?? targetItem.sizeCode;
      const lastSyncedSizeCode = itemLastSyncedSizeCodeMapRef.current.get(itemId);

      if (lastSyncedSizeCode === targetSizeCode) {
        return;
      }

      itemSizePersistInFlightIdsRef.current.add(itemId);

      try {
        const payload = await trackPageDbWrite(async () => {
          const response = await fetch(buildPageItemEndpoint(handle, itemId), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "size",
              data: {
                sizeCode: targetSizeCode,
              },
            }),
          });

          const payload = (await response.json()) as PersistedPageItemApiResponse | ErrorApiResponse;

          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.status === "error" ? payload.message : "Failed to resize item.");
          }

          return payload;
        });

        const updatedItem = normalizeCreatedItem(payload.item);

        itemLastSyncedSizeCodeMapRef.current.set(itemId, updatedItem.sizeCode);
        setItems((prevItems) =>
          prevItems.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              sizeCode: updatedItem.sizeCode,
              updatedAt: updatedItem.updatedAt,
            };
          }),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to resize item.";
        const rollbackSizeCode = itemLastSyncedSizeCodeMapRef.current.get(itemId);

        if (rollbackSizeCode) {
          setItems((prevItems) => {
            let hasChanged = false;

            const nextItems = prevItems.map((item) => {
              if (item.id !== itemId || item.sizeCode !== targetSizeCode) {
                return item;
              }

              hasChanged = true;

              return {
                ...item,
                sizeCode: rollbackSizeCode,
              };
            });

            return hasChanged ? nextItems : prevItems;
          });
        }

        toast.error("Failed to resize item", {
          description: message,
        });
      } finally {
        itemSizePersistInFlightIdsRef.current.delete(itemId);

        if (itemSizePersistQueuedIdsRef.current.has(itemId)) {
          itemSizePersistQueuedIdsRef.current.delete(itemId);
          void persistItemSize(itemId);
        }
      }
    },
    [handle, trackPageDbWrite],
  );

  /**
   * 아이템 순서를 서버에 저장한다.
   * 드래그 중 중복 저장은 마지막 순서만 큐잉해 처리하고, 실패 시 마지막 동기화 상태로 즉시 복구한다.
   */
  const persistItemOrder = useCallback(async () => {
    if (itemOrderPersistInFlightRef.current) {
      itemOrderPersistQueuedRef.current = true;
      return;
    }

    const orderedItemIds = resolvePageItemIds(itemsRef.current);

    if (hasSamePageItemIdOrder(itemLastSyncedOrderIdsRef.current, orderedItemIds)) {
      return;
    }

    itemOrderPersistInFlightRef.current = true;

    try {
      await trackPageDbWrite(async () => {
        const response = await fetch(buildPageItemsReorderEndpoint(handle), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemIds: orderedItemIds,
          }),
        });

        const payload = (await response.json()) as { status?: string; message?: string };

        if (!response.ok || payload.status !== "success") {
          throw new Error(typeof payload.message === "string" ? payload.message : "Failed to reorder item.");
        }
      });

      itemLastSyncedOrderIdsRef.current = orderedItemIds;
    } catch {
      const rollbackItemIds = itemLastSyncedOrderIdsRef.current;

      setItems((prevItems) => applyPageItemOrder(prevItems, rollbackItemIds));
      toast.error("Failed to reorder item");
    } finally {
      itemOrderPersistInFlightRef.current = false;

      if (itemOrderPersistQueuedRef.current) {
        itemOrderPersistQueuedRef.current = false;
        void persistItemOrder();
      }
    }
  }, [handle, trackPageDbWrite]);

  const scheduleItemOrderPersist = useCallback(() => {
    if (itemOrderPersistTimerRef.current) {
      window.clearTimeout(itemOrderPersistTimerRef.current);
    }

    itemOrderPersistTimerRef.current = window.setTimeout(() => {
      itemOrderPersistTimerRef.current = null;
      void persistItemOrder();
    }, ITEM_REORDER_PERSIST_DEBOUNCE_MS);
  }, [persistItemOrder]);

  const scheduleMemoPersist = useCallback(
    (itemId: string) => {
      const activeTimerId = memoSaveTimerMapRef.current.get(itemId);

      if (activeTimerId) {
        window.clearTimeout(activeTimerId);
      }

      const nextTimerId = window.setTimeout(() => {
        memoSaveTimerMapRef.current.delete(itemId);
        void persistItemMemo(itemId);
      }, ITEM_COMPOSER_AUTOSAVE_DEBOUNCE_MS);

      memoSaveTimerMapRef.current.set(itemId, nextTimerId);
    },
    [persistItemMemo],
  );

  const scheduleLinkTitlePersist = useCallback(
    (itemId: string) => {
      const activeTimerId = linkTitleSaveTimerMapRef.current.get(itemId);

      if (activeTimerId) {
        window.clearTimeout(activeTimerId);
      }

      const nextTimerId = window.setTimeout(() => {
        linkTitleSaveTimerMapRef.current.delete(itemId);
        void persistItemLinkTitle(itemId);
      }, ITEM_COMPOSER_AUTOSAVE_DEBOUNCE_MS);

      linkTitleSaveTimerMapRef.current.set(itemId, nextTimerId);
    },
    [persistItemLinkTitle],
  );

  const cancelMemoPersist = useCallback((itemId: string) => {
    const activeTimerId = memoSaveTimerMapRef.current.get(itemId);

    if (activeTimerId) {
      window.clearTimeout(activeTimerId);
      memoSaveTimerMapRef.current.delete(itemId);
    }

    memoPersistQueuedIdsRef.current.delete(itemId);
  }, []);

  const cancelLinkTitlePersist = useCallback((itemId: string) => {
    const activeTimerId = linkTitleSaveTimerMapRef.current.get(itemId);

    if (activeTimerId) {
      window.clearTimeout(activeTimerId);
      linkTitleSaveTimerMapRef.current.delete(itemId);
    }

    linkTitlePersistQueuedIdsRef.current.delete(itemId);
  }, []);

  const handleOpenComposer = useCallback(() => {
    setDraft((prevDraft) => {
      if (prevDraft) {
        return prevDraft;
      }

      return {
        id: createDraftId(),
        kind: "memo",
        content: "",
        hasUserInput: false,
        isSaving: false,
      };
    });

    setFocusRequestId((prevValue) => prevValue + 1);
  }, []);

  /**
   * 링크 OG 조회/생성 중 표시할 링크 draft를 연다.
   */
  const handleOpenLinkDraft = useCallback(() => {
    setDraft((prevDraft) => {
      if (prevDraft?.kind === "memo" && hasMeaningfulItemContent(prevDraft.content)) {
        return prevDraft;
      }

      if (prevDraft?.kind === "link") {
        return prevDraft;
      }

      return {
        id: createDraftId(),
        kind: "link",
        content: "",
        hasUserInput: false,
        isSaving: true,
      };
    });
  }, []);

  const handleDraftChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = normalizeItemInput(event.target.value);

    setDraft((prevDraft) => {
      if (!prevDraft || prevDraft.kind !== "memo") {
        return prevDraft;
      }

      return {
        ...prevDraft,
        content: nextValue,
        hasUserInput: true,
      };
    });
  }, []);

  /**
   * 작성 중인 draft를 화면에서 즉시 제거한다.
   */
  const handleRemoveDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const handleItemMemoChange = useCallback(
    (itemId: string, nextValue: string) => {
      const normalizedValue = normalizeItemInput(nextValue);

      setItems((prevItems) => updateMemoItemContent(prevItems, itemId, normalizedValue));
      scheduleMemoPersist(itemId);
    },
    [scheduleMemoPersist],
  );

  const handleItemLinkTitleChange = useCallback(
    (itemId: string, nextValue: string) => {
      const normalizedValue = normalizeLinkTitleInput(nextValue);

      setItems((prevItems) => updateLinkItemTitle(prevItems, itemId, normalizedValue));
      scheduleLinkTitlePersist(itemId);
    },
    [scheduleLinkTitlePersist],
  );

  const handleItemLinkTitleSubmit = useCallback(
    (itemId: string) => {
      cancelLinkTitlePersist(itemId);
      void persistItemLinkTitle(itemId);
    },
    [cancelLinkTitlePersist, persistItemLinkTitle],
  );

  const handleItemResize = useCallback(
    (itemId: string, nextSizeCode: PageItemSizeCode) => {
      const targetItem = itemsRef.current.find((item) => item.id === itemId);

      if (!targetItem || targetItem.sizeCode === nextSizeCode) {
        return;
      }

      setItems((prevItems) => updatePageItemSize(prevItems, itemId, nextSizeCode));
      void persistItemSize(itemId, nextSizeCode);
    },
    [persistItemSize],
  );

  const handleItemReorder = useCallback(
    (activeItemId: string, overItemId: string) => {
      const reorderedItems = reorderPageItemsById(itemsRef.current, activeItemId, overItemId);

      if (reorderedItems === itemsRef.current) {
        return;
      }

      setItems(reorderedItems);
      scheduleItemOrderPersist();
    },
    [scheduleItemOrderPersist],
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      if (itemDeleteInFlightIdsRef.current.has(itemId)) {
        return;
      }

      const { nextItems, removedItem } = removePageItemById(itemsRef.current, itemId);

      if (!removedItem) {
        return;
      }

      const removedItemLastSyncedSizeCode = itemLastSyncedSizeCodeMapRef.current.get(itemId) ?? removedItem.sizeCode;

      itemDeleteInFlightIdsRef.current.add(itemId);
      if (itemOrderPersistTimerRef.current) {
        window.clearTimeout(itemOrderPersistTimerRef.current);
        itemOrderPersistTimerRef.current = null;
      }
      itemOrderPersistQueuedRef.current = false;
      cancelMemoPersist(itemId);
      cancelLinkTitlePersist(itemId);
      itemLastSyncedSizeCodeMapRef.current.delete(itemId);
      linkTitlePersistQueuedIdsRef.current.delete(itemId);
      linkTitlePersistInFlightIdsRef.current.delete(itemId);
      itemSizePersistQueuedIdsRef.current.delete(itemId);
      itemSizePersistInFlightIdsRef.current.delete(itemId);
      setItems(nextItems);

      void (async () => {
        try {
          await trackPageDbWrite(async () => {
            const response = await fetch(buildPageItemEndpoint(handle, itemId), {
              method: "DELETE",
            });

            const payload = (await response.json()) as { status?: string; message?: string };

            if (!response.ok || payload.status !== "success") {
              throw new Error(typeof payload.message === "string" ? payload.message : "Failed to delete item.");
            }
          });

          itemLastSyncedOrderIdsRef.current = itemLastSyncedOrderIdsRef.current.filter((savedItemId) => savedItemId !== itemId);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to delete item.";

          itemLastSyncedSizeCodeMapRef.current.set(itemId, removedItemLastSyncedSizeCode);
          setItems((prevItems) => restoreRemovedPageItem(prevItems, removedItem));
          toast.error("Failed to delete item", {
            description: message,
          });
        } finally {
          itemDeleteInFlightIdsRef.current.delete(itemId);
        }
      })();
    },
    [cancelLinkTitlePersist, cancelMemoPersist, handle, trackPageDbWrite],
  );

  return {
    draft,
    items,
    focusRequestId,
    handleOpenComposer,
    handleOpenLinkDraft,
    handleDraftChange,
    handleRemoveDraft,
    handleCreateLinkItemFromOg,
    handleCreateMapItem,
    handleCreateMediaItemFromFile,
    handleUpdateMapItem,
    handleItemMemoChange,
    handleItemLinkTitleChange,
    handleItemLinkTitleSubmit,
    handleItemResize,
    handleItemReorder,
    handleRemoveItem,
  };
}
