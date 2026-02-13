import { describe, expect, test } from "vitest";
import { resolvePublicPageAuthActionType, resolvePublicPageSignInHref } from "@/components/auth/public-page-auth-action";

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

  test("세션이 있고 본인 페이지면 null을 반환한다", () => {
    // Arrange
    const input = {
      hasSession: true,
      isOwnerPage: true,
    };

    // Act
    const actionType = resolvePublicPageAuthActionType(input);

    // Assert
    expect(actionType).toBeNull();
  });
});

describe("resolvePublicPageSignInHref", () => {
  test("returnTo가 없으면 기본 Sign in 경로를 반환한다", () => {
    // Arrange
    const input = {};

    // Act
    const href = resolvePublicPageSignInHref(input);

    // Assert
    expect(href).toBe("/sign-in");
  });

  test("returnTo가 있으면 인코딩된 복귀 경로를 포함한다", () => {
    // Arrange
    const input = {
      returnTo: "/moon/rabbit",
    };

    // Act
    const href = resolvePublicPageSignInHref(input);

    // Assert
    expect(href).toBe("/sign-in?returnTo=%2Fmoon%2Frabbit");
  });
});
