import { describe, expect, test } from "vitest";
import { resolvePublicPageAuthActionType } from "@/components/auth/public-page-auth-action";

describe("resolvePublicPageAuthActionType", () => {
  test("세션이 없으면 sign-in 액션을 반환한다", () => {
    // Arrange
    const input = {
      hasSession: false,
      isOwnerPage: false,
    };

    // Act
    const actionType = resolvePublicPageAuthActionType(input);

    // Assert
    expect(actionType).toBe("sign-in");
  });

  test("세션이 있고 본인 페이지가 아니면 my-page 액션을 반환한다", () => {
    // Arrange
    const input = {
      hasSession: true,
      isOwnerPage: false,
    };

    // Act
    const actionType = resolvePublicPageAuthActionType(input);

    // Assert
    expect(actionType).toBe("my-page");
  });

  test("세션이 있고 본인 페이지면 sign-out 액션을 반환한다", () => {
    // Arrange
    const input = {
      hasSession: true,
      isOwnerPage: true,
    };

    // Act
    const actionType = resolvePublicPageAuthActionType(input);

    // Assert
    expect(actionType).toBe("sign-out");
  });
});
