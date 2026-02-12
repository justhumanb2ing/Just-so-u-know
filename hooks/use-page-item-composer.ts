"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PAGE_ITEM_SIZE_CODES, type PageItemSizeCode } from "@/service/page/item-size";
import type { CrawlResponse } from "@/service/page/og-crawl";

export const ITEM_COMPOSER_AUTOSAVE_DEBOUNCE_MS = 800;
export const DEFAULT_PAGE_ITEM_SIZE_CODE: PageItemSizeCode = "wide-short";

const WINDOWS_LINE_BREAK_PATTERN = /\r\n?/g;
const LINK_TITLE_LINE_BREAK_PATTERN = /\r?\n/g;

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

type ItemDraftState = {
  id: string;
  content: string;
  hasUserInput: boolean;
  isSaving: boolean;
};

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

export type PageItemComposerController = {
  draft: ItemDraftState | null;
  items: PageItem[];
  focusRequestId: number;
  handleOpenComposer: () => void;
  handleDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleCreateLinkItemFromOg: (crawlResponse: CrawlResponse) => Promise<boolean>;
  handleItemMemoChange: (itemId: string, nextValue: string) => void;
  handleItemLinkTitleChange: (itemId: string, nextValue: string) => void;
  handleItemLinkTitleSubmit: (itemId: string) => void;
  handleItemResize: (itemId: string, nextSizeCode: PageItemSizeCode) => void;
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

function sortPageItems(items: PageItem[]) {
  return [...items].sort((a, b) => a.orderKey - b.orderKey);
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
  const itemLastSyncedSizeCodeMapRef = useRef<Map<string, PageItemSizeCode>>(
    new Map((normalizedInitialItemsRef.current ?? []).map((item) => [item.id, item.sizeCode])),
  );
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

      memoSaveTimerMapRef.current.clear();
      memoPersistInFlightIdsRef.current.clear();
      memoPersistQueuedIdsRef.current.clear();
      linkTitleSaveTimerMapRef.current.clear();
      linkTitlePersistInFlightIdsRef.current.clear();
      linkTitlePersistQueuedIdsRef.current.clear();
      itemSizePersistInFlightIdsRef.current.clear();
      itemSizePersistQueuedIdsRef.current.clear();
      itemLastSyncedSizeCodeMapRef.current.clear();
      itemDeleteInFlightIdsRef.current.clear();
    };
  }, []);

  const persistDraft = useCallback(async () => {
    const currentDraft = draftRef.current;

    if (!currentDraft || currentDraft.isSaving) {
      return;
    }

    if (!hasMeaningfulItemContent(currentDraft.content)) {
      return;
    }

    setDraft((prevDraft) => {
      if (!prevDraft || prevDraft.id !== currentDraft.id) {
        return prevDraft;
      }

      return {
        ...prevDraft,
        isSaving: true,
      };
    });

    try {
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

      const createdItem = normalizeCreatedItem(payload.item);
      itemLastSyncedSizeCodeMapRef.current.set(createdItem.id, createdItem.sizeCode);

      setItems((prevItems) => sortPageItems([...prevItems, createdItem]));
      setDraft((prevDraft) => resolveDraftAfterPersistSuccess(prevDraft, currentDraft.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create item.";

      setDraft((prevDraft) => {
        if (!prevDraft || prevDraft.id !== currentDraft.id) {
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
  }, [handle]);

  /**
   * OG 조회 결과를 기반으로 link 아이템을 생성한다.
   */
  const handleCreateLinkItemFromOg = useCallback(
    async (crawlResponse: CrawlResponse) => {
      const linkPayload = resolveLinkItemCreatePayloadFromCrawl(crawlResponse);

      if (!linkPayload) {
        toast.error("Failed to save item", {
          description: "Link title and URL are required.",
        });
        return false;
      }

      try {
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

        const createdItem = normalizeCreatedItem(payload.item);
        itemLastSyncedSizeCodeMapRef.current.set(createdItem.id, createdItem.sizeCode);
        setItems((prevItems) => sortPageItems([...prevItems, createdItem]));

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create item.";

        toast.error("Failed to save item", {
          description: message,
        });
        return false;
      }
    },
    [handle],
  );

  useEffect(() => {
    if (!draft || draft.isSaving || !draft.hasUserInput) {
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
    [handle],
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
    [handle],
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
    [handle],
  );

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
        content: "",
        hasUserInput: false,
        isSaving: false,
      };
    });

    setFocusRequestId((prevValue) => prevValue + 1);
  }, []);

  const handleDraftChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = normalizeItemInput(event.target.value);

    setDraft((prevDraft) => {
      if (!prevDraft) {
        return prevDraft;
      }

      return {
        ...prevDraft,
        content: nextValue,
        hasUserInput: true,
      };
    });
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
          const response = await fetch(buildPageItemEndpoint(handle, itemId), {
            method: "DELETE",
          });

          const payload = (await response.json()) as { status?: string; message?: string };

          if (!response.ok || payload.status !== "success") {
            throw new Error(typeof payload.message === "string" ? payload.message : "Failed to delete item.");
          }
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
    [cancelLinkTitlePersist, cancelMemoPersist, handle],
  );

  return {
    draft,
    items,
    focusRequestId,
    handleOpenComposer,
    handleDraftChange,
    handleCreateLinkItemFromOg,
    handleItemMemoChange,
    handleItemLinkTitleChange,
    handleItemLinkTitleSubmit,
    handleItemResize,
    handleRemoveItem,
  };
}
