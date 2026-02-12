"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const ITEM_COMPOSER_AUTOSAVE_DEBOUNCE_MS = 800;
export const DEFAULT_PAGE_ITEM_SIZE_CODE = "wide-short" as const;

const WINDOWS_LINE_BREAK_PATTERN = /\r\n?/g;
const PAGE_ITEM_SIZE_CODES = ["wide-short", "wide-tall", "wide-full"] as const;

export type PageItemSizeCode = (typeof PAGE_ITEM_SIZE_CODES)[number];

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
  handleItemMemoChange: (itemId: string, nextValue: string) => void;
};

export type UsePageItemComposerParams = {
  handle: string;
  initialItems?: InitialPageItem[];
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

/**
 * memo 아이템 데이터에서 content를 추출한다.
 */
export function resolveMemoItemContent(item: PageItem) {
  if (!item.data || typeof item.data !== "object") {
    return "";
  }

  const data = item.data as Record<string, unknown>;
  const content = data.content;

  if (typeof content !== "string") {
    return "";
  }

  return normalizeItemInput(content);
}

/**
 * memo data에 content를 주입한 새 객체를 반환한다.
 */
function mergeMemoItemDataContent(data: unknown, content: string) {
  const nextData = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  return {
    ...nextData,
    content,
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
 * 현재는 memo 타입 생성/수정만 지원하지만, 호출부는 타입 확장을 고려한 아이템 컨트롤러로 사용한다.
 */
export function usePageItemComposer({ handle, initialItems = [] }: UsePageItemComposerParams): PageItemComposerController {
  const [draft, setDraft] = useState<ItemDraftState | null>(null);
  const [items, setItems] = useState<PageItem[]>(() => normalizeInitialPageItems(initialItems));
  const [focusRequestId, setFocusRequestId] = useState(0);
  const draftRef = useRef<ItemDraftState | null>(null);
  const itemsRef = useRef<PageItem[]>(items);
  const memoSaveTimerMapRef = useRef<Map<string, number>>(new Map());
  const memoPersistInFlightIdsRef = useRef<Set<string>>(new Set());
  const memoPersistQueuedIdsRef = useRef<Set<string>>(new Set());

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

      memoSaveTimerMapRef.current.clear();
      memoPersistInFlightIdsRef.current.clear();
      memoPersistQueuedIdsRef.current.clear();
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

  return {
    draft,
    items,
    focusRequestId,
    handleOpenComposer,
    handleDraftChange,
    handleItemMemoChange,
  };
}
