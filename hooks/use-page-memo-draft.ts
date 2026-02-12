"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const MEMO_AUTOSAVE_DEBOUNCE_MS = 800;
export const DEFAULT_MEMO_SIZE_CODE = "wide-short" as const;

const WINDOWS_LINE_BREAK_PATTERN = /\r\n?/g;
const MEMO_SIZE_CODES = ["wide-short", "wide-tall", "wide-full"] as const;

export type MemoSizeCode = (typeof MEMO_SIZE_CODES)[number];

type MemoDraftState = {
  id: string;
  content: string;
  hasUserInput: boolean;
  isSaving: boolean;
};

type CreatedMemoItemApiResponse = {
  status: "success";
  item: {
    id: string;
    sizeCode: unknown;
    data: {
      content?: unknown;
    };
    createdAt: string;
    updatedAt: string;
  };
};

type ErrorApiResponse = {
  status: "error";
  message: string;
};

export type SavedMemoItem = {
  id: string;
  sizeCode: MemoSizeCode;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PageMemoDraftController = {
  draft: MemoDraftState | null;
  savedMemos: SavedMemoItem[];
  focusRequestId: number;
  handleAddMemoDraft: () => void;
  handleDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export type UsePageMemoDraftParams = {
  storedHandle: string;
};

function createMemoDraftId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `memo-draft-${Date.now()}`;
}

/**
 * textarea 입력의 줄바꿈을 `\n` 형식으로 정규화한다.
 */
export function normalizeMemoInput(value: string) {
  return value.replace(WINDOWS_LINE_BREAK_PATTERN, "\n");
}

/**
 * memo 내용에 저장할 유효 텍스트가 있는지 판단한다.
 */
export function hasMeaningfulMemoContent(value: string) {
  return value.trim().length > 0;
}

/**
 * API 응답의 sizeCode를 허용 가능한 memo 사이즈 코드로 정규화한다.
 */
export function normalizeMemoSizeCode(value: unknown): MemoSizeCode {
  if (typeof value !== "string") {
    return DEFAULT_MEMO_SIZE_CODE;
  }

  return MEMO_SIZE_CODES.includes(value as MemoSizeCode) ? (value as MemoSizeCode) : DEFAULT_MEMO_SIZE_CODE;
}

/**
 * 저장용 페이지 아이템 API 엔드포인트를 생성한다.
 */
export function buildPageItemsEndpoint(storedHandle: string) {
  return `/api/pages/${encodeURIComponent(storedHandle)}/items`;
}

/**
 * memo draft의 생성/자동 저장 상태를 캡슐화한다.
 */
export function usePageMemoDraft({ storedHandle }: UsePageMemoDraftParams): PageMemoDraftController {
  const [draft, setDraft] = useState<MemoDraftState | null>(null);
  const [savedMemos, setSavedMemos] = useState<SavedMemoItem[]>([]);
  const [focusRequestId, setFocusRequestId] = useState(0);
  const draftRef = useRef<MemoDraftState | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const persistDraft = useCallback(async () => {
    const currentDraft = draftRef.current;

    if (!currentDraft || currentDraft.isSaving) {
      return;
    }

    if (!hasMeaningfulMemoContent(currentDraft.content)) {
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
      const response = await fetch(buildPageItemsEndpoint(storedHandle), {
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

      const payload = (await response.json()) as CreatedMemoItemApiResponse | ErrorApiResponse;

      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.status === "error" ? payload.message : "Failed to create memo.");
      }

      setSavedMemos((prevMemos) => [
        ...prevMemos,
        {
          id: payload.item.id,
          sizeCode: normalizeMemoSizeCode(payload.item.sizeCode),
          content: typeof payload.item.data?.content === "string" ? payload.item.data.content : currentDraft.content,
          createdAt: payload.item.createdAt,
          updatedAt: payload.item.updatedAt,
        },
      ]);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create memo.";

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
      toast.error("Failed to save memo", {
        description: message,
      });
    }
  }, [storedHandle]);

  useEffect(() => {
    if (!draft || draft.isSaving || !draft.hasUserInput) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistDraft();
    }, MEMO_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, persistDraft]);

  const handleAddMemoDraft = useCallback(() => {
    setDraft((prevDraft) => {
      if (prevDraft) {
        return prevDraft;
      }

      return {
        id: createMemoDraftId(),
        content: "",
        hasUserInput: false,
        isSaving: false,
      };
    });

    setFocusRequestId((prevValue) => prevValue + 1);
  }, []);

  const handleDraftChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = normalizeMemoInput(event.target.value);

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

  return {
    draft,
    savedMemos,
    focusRequestId,
    handleAddMemoDraft,
    handleDraftChange,
  };
}
