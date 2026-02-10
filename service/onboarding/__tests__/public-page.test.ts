import { describe, expect, test } from "vitest";
import { normalizeStoredHandleFromPath } from "@/service/onboarding/public-page";

describe("public-page", () => {
  test("유효한 @handle 경로를 소문자로 정규화한다", () => {
    // Arrange
    const pathHandle = "@TeSter123";

    // Act
    const normalized = normalizeStoredHandleFromPath(pathHandle);

    // Assert
    expect(normalized).toBe("@tester123");
  });

  test("@ 접두가 없는 경로는 null을 반환한다", () => {
    // Arrange
    const pathHandle = "tester123";

    // Act
    const normalized = normalizeStoredHandleFromPath(pathHandle);

    // Assert
    expect(normalized).toBeNull();
  });

  test("패턴 위반 경로는 null을 반환한다", () => {
    // Arrange
    const pathHandle = "@test-er";

    // Act
    const normalized = normalizeStoredHandleFromPath(pathHandle);

    // Assert
    expect(normalized).toBeNull();
  });
});
