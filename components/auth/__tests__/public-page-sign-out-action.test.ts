import { describe, expect, test } from "vitest";
import { shouldRenderPublicPageSignOutAction } from "@/components/auth/public-page-sign-out-action";

describe("shouldRenderPublicPageSignOutAction", () => {
  test("세션이 없으면 false를 반환한다", () => {
    // Arrange
    const input = {
      hasSession: false,
      isOwnerPage: true,
    };

    // Act
    const shouldRender = shouldRenderPublicPageSignOutAction(input);

    // Assert
    expect(shouldRender).toBe(false);
  });

  test("세션이 있고 본인 페이지가 아니면 false를 반환한다", () => {
    // Arrange
    const input = {
      hasSession: true,
      isOwnerPage: false,
    };

    // Act
    const shouldRender = shouldRenderPublicPageSignOutAction(input);

    // Assert
    expect(shouldRender).toBe(false);
  });

  test("세션이 있고 본인 페이지면 true를 반환한다", () => {
    // Arrange
    const input = {
      hasSession: true,
      isOwnerPage: true,
    };

    // Act
    const shouldRender = shouldRenderPublicPageSignOutAction(input);

    // Assert
    expect(shouldRender).toBe(true);
  });
});
