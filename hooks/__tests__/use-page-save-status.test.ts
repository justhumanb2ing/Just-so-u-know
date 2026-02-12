import { describe, expect, test } from "vitest";
import {
  PAGE_SAVE_STATUS_HIDE_DELAY_MS,
  type PageSaveStatusState,
  reducePageSaveStateOnWriteFinish,
  reducePageSaveStateOnWriteStart,
  resolvePageSaveStatusPhase,
} from "@/hooks/use-page-save-status";

describe("usePageSaveStatus helpers", () => {
  test("saved 메시지 자동 숨김 시간은 2초를 사용한다", () => {
    // Arrange
    const expectedMs = 2000;

    // Act
    const result = PAGE_SAVE_STATUS_HIDE_DELAY_MS;

    // Assert
    expect(result).toBe(expectedMs);
  });

  test("pending 저장이 있으면 phase는 saving을 반환한다", () => {
    // Arrange
    const state: PageSaveStatusState = {
      pendingWriteCount: 1,
      signal: "saved",
    };

    // Act
    const result = resolvePageSaveStatusPhase(state);

    // Assert
    expect(result).toBe("saving");
  });

  test("저장 완료 표시가 켜져 있고 pending이 없으면 phase는 saved를 반환한다", () => {
    // Arrange
    const state: PageSaveStatusState = {
      pendingWriteCount: 0,
      signal: "saved",
    };

    // Act
    const result = resolvePageSaveStatusPhase(state);

    // Assert
    expect(result).toBe("saved");
  });

  test("저장 실패 표시가 켜져 있고 pending이 없으면 phase는 error를 반환한다", () => {
    // Arrange
    const state: PageSaveStatusState = {
      pendingWriteCount: 0,
      signal: "error",
    };

    // Act
    const result = resolvePageSaveStatusPhase(state);

    // Assert
    expect(result).toBe("error");
  });

  test("쓰기 시작 시 pending 카운트를 증가시키고 saved 표시를 숨긴다", () => {
    // Arrange
    const state: PageSaveStatusState = {
      pendingWriteCount: 0,
      signal: "saved",
    };

    // Act
    const result = reducePageSaveStateOnWriteStart(state);

    // Assert
    expect(result).toEqual({
      pendingWriteCount: 1,
      signal: "none",
    });
  });

  test("마지막 쓰기가 성공으로 끝나면 saved 표시를 켠다", () => {
    // Arrange
    const state: PageSaveStatusState = {
      pendingWriteCount: 1,
      signal: "none",
    };

    // Act
    const result = reducePageSaveStateOnWriteFinish(state, true);

    // Assert
    expect(result).toEqual({
      pendingWriteCount: 0,
      signal: "saved",
    });
  });

  test("마지막 쓰기가 실패로 끝나면 saved 표시를 숨긴다", () => {
    // Arrange
    const state: PageSaveStatusState = {
      pendingWriteCount: 1,
      signal: "none",
    };

    // Act
    const result = reducePageSaveStateOnWriteFinish(state, false);

    // Assert
    expect(result).toEqual({
      pendingWriteCount: 0,
      signal: "error",
    });
  });

  test("동시 쓰기 중 하나만 완료되면 여전히 saved를 노출하지 않는다", () => {
    // Arrange
    const state: PageSaveStatusState = {
      pendingWriteCount: 2,
      signal: "none",
    };

    // Act
    const result = reducePageSaveStateOnWriteFinish(state, true);

    // Assert
    expect(result).toEqual({
      pendingWriteCount: 1,
      signal: "none",
    });
  });
});
