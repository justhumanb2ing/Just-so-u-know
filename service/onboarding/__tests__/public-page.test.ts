import { describe, expect, test } from "vitest";
import { normalizeStoredHandleFromPath, shouldDenyPrivatePageAccess } from "@/service/onboarding/public-page";

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

describe("private page access policy", () => {
  test("비소유자가 비공개 페이지에 접근하면 차단한다", () => {
    // Arrange
    const policyInput = {
      isPublic: false,
      isOwner: false,
    };

    // Act
    const denied = shouldDenyPrivatePageAccess(policyInput);

    // Assert
    expect(denied).toBe(true);
  });

  test("소유자는 비공개 페이지 접근이 허용된다", () => {
    // Arrange
    const policyInput = {
      isPublic: false,
      isOwner: true,
    };

    // Act
    const denied = shouldDenyPrivatePageAccess(policyInput);

    // Assert
    expect(denied).toBe(false);
  });

  test("공개 페이지는 비소유자도 접근이 허용된다", () => {
    // Arrange
    const policyInput = {
      isPublic: true,
      isOwner: false,
    };

    // Act
    const denied = shouldDenyPrivatePageAccess(policyInput);

    // Assert
    expect(denied).toBe(false);
  });
});
