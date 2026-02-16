import { describe, expect, test } from "vitest";
import { resolveShouldTrackHandleUpdateFeature } from "@/components/public-page/editable-page-handle-form";

describe("resolveShouldTrackHandleUpdateFeature", () => {
  test("이전 handle과 다음 handle이 다르면 이벤트 기록 대상으로 판단한다", () => {
    // Arrange
    const input = {
      previousStoredHandle: "@before",
      nextStoredHandle: "@after",
    };

    // Act
    const result = resolveShouldTrackHandleUpdateFeature(input);

    // Assert
    expect(result).toBe(true);
  });

  test("동일 handle 재제출(no-op)이면 이벤트 기록 대상에서 제외한다", () => {
    // Arrange
    const input = {
      previousStoredHandle: "@same",
      nextStoredHandle: "@same",
    };

    // Act
    const result = resolveShouldTrackHandleUpdateFeature(input);

    // Assert
    expect(result).toBe(false);
  });
});
