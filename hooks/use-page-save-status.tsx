"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStrictContext } from "@/lib/get-strict-context";

export const PAGE_SAVE_STATUS_HIDE_DELAY_MS = 2000;

export type PageSaveStatusPhase = "hidden" | "saving" | "saved" | "error";
export type PageSaveSignal = "none" | "saved" | "error";

export type PageSaveStatusState = {
  pendingWriteCount: number;
  signal: PageSaveSignal;
};

type PageSaveStatusReporter = {
  beginWrite: () => string;
  endWriteSuccess: (token: string) => void;
  endWriteError: (token: string) => void;
};

type PageSaveStatusView = {
  phase: PageSaveStatusPhase;
};

const [PageSaveStatusReporterProvider, usePageSaveStatusReporter] =
  getStrictContext<PageSaveStatusReporter>("PageSaveStatusReporterProvider");
const [PageSaveStatusViewProvider, usePageSaveStatusView] = getStrictContext<PageSaveStatusView>("PageSaveStatusViewProvider");

/**
 * 저장 큐 상태에서 UI 표시 단계를 계산한다.
 */
export function resolvePageSaveStatusPhase(state: PageSaveStatusState): PageSaveStatusPhase {
  if (state.pendingWriteCount > 0) {
    return "saving";
  }

  if (state.signal === "saved") {
    return "saved";
  }

  if (state.signal === "error") {
    return "error";
  }

  return "hidden";
}

/**
 * 쓰기 시작 시 pending 카운트를 올리고 saved 표시를 즉시 숨긴다.
 */
export function reducePageSaveStateOnWriteStart(state: PageSaveStatusState): PageSaveStatusState {
  return {
    pendingWriteCount: state.pendingWriteCount + 1,
    signal: "none",
  };
}

/**
 * 쓰기 완료 시 pending 카운트를 내리고 마지막 성공 완료일 때만 saved를 노출한다.
 */
export function reducePageSaveStateOnWriteFinish(state: PageSaveStatusState, isSuccess: boolean): PageSaveStatusState {
  const nextPendingWriteCount = Math.max(0, state.pendingWriteCount - 1);

  if (nextPendingWriteCount > 0) {
    return {
      pendingWriteCount: nextPendingWriteCount,
      signal: "none",
    };
  }

  return {
    pendingWriteCount: 0,
    signal: isSuccess ? "saved" : "error",
  };
}

/**
 * 페이지 내 DB 쓰기 작업을 집계해 저장 상태를 전역으로 제공한다.
 */
export function PageSaveStatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PageSaveStatusState>({
    pendingWriteCount: 0,
    signal: "none",
  });
  const tokenSequenceRef = useRef(0);
  const activeWriteTokenSetRef = useRef<Set<string>>(new Set());
  const hideSavedTimerRef = useRef<number | null>(null);

  const clearHideSavedTimer = useCallback(() => {
    if (hideSavedTimerRef.current === null) {
      return;
    }

    window.clearTimeout(hideSavedTimerRef.current);
    hideSavedTimerRef.current = null;
  }, []);

  const scheduleHideSaved = useCallback(() => {
    clearHideSavedTimer();
    hideSavedTimerRef.current = window.setTimeout(() => {
      hideSavedTimerRef.current = null;
      setState((prevState) => ({
        ...prevState,
        signal: "none",
      }));
    }, PAGE_SAVE_STATUS_HIDE_DELAY_MS);
  }, [clearHideSavedTimer]);

  useEffect(() => {
    return () => {
      clearHideSavedTimer();
      activeWriteTokenSetRef.current.clear();
    };
  }, [clearHideSavedTimer]);

  const beginWrite = useCallback(() => {
    tokenSequenceRef.current += 1;
    const token = `page-save-${tokenSequenceRef.current}`;

    activeWriteTokenSetRef.current.add(token);
    clearHideSavedTimer();
    setState((prevState) => reducePageSaveStateOnWriteStart(prevState));

    return token;
  }, [clearHideSavedTimer]);

  const endWrite = useCallback(
    (token: string, isSuccess: boolean) => {
      if (!activeWriteTokenSetRef.current.has(token)) {
        return;
      }

      activeWriteTokenSetRef.current.delete(token);
      const shouldShowSaved = isSuccess && activeWriteTokenSetRef.current.size === 0;

      if (!shouldShowSaved) {
        clearHideSavedTimer();
      }

      setState((prevState) => reducePageSaveStateOnWriteFinish(prevState, isSuccess));

      if (shouldShowSaved) {
        scheduleHideSaved();
      }
    },
    [clearHideSavedTimer, scheduleHideSaved],
  );

  const reporterValue = useMemo<PageSaveStatusReporter>(
    () => ({
      beginWrite,
      endWriteSuccess: (token: string) => {
        endWrite(token, true);
      },
      endWriteError: (token: string) => {
        endWrite(token, false);
      },
    }),
    [beginWrite, endWrite],
  );

  const viewValue = useMemo<PageSaveStatusView>(() => {
    const phase = resolvePageSaveStatusPhase(state);
    return { phase };
  }, [state]);

  return (
    <PageSaveStatusReporterProvider value={reporterValue}>
      <PageSaveStatusViewProvider value={viewValue}>{children}</PageSaveStatusViewProvider>
    </PageSaveStatusReporterProvider>
  );
}

/**
 * DB 쓰기 Promise를 저장 상태 집계기에 연결해 성공/실패를 자동 기록한다.
 */
export function useTrackPageDbWrite() {
  const reporter = usePageSaveStatusReporter();

  return useCallback(
    async <TResult,>(writeAction: () => Promise<TResult>) => {
      const token = reporter.beginWrite();

      try {
        const result = await writeAction();
        reporter.endWriteSuccess(token);
        return result;
      } catch (error) {
        reporter.endWriteError(token);
        throw error;
      }
    },
    [reporter],
  );
}

export { usePageSaveStatusReporter, usePageSaveStatusView };
