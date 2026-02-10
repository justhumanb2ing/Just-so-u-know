import { describe, expect, test } from "vitest";

import { resolveCTAButtonState } from "@/components/layout/cta-button-state";

describe("resolveCTAButtonState", () => {
  test("세션이 없으면 Sign in 버튼 정보를 반환한다", () => {
    // Arrange
    const hasSession = false;

    // Act
    const state = resolveCTAButtonState(hasSession);

    // Assert
    expect(state).toEqual({
      action: "sign-in",
      label: "Sign in",
      href: "/sign-in",
      nativeButton: false,
    });
  });

  test("세션이 있으면 Sign out 버튼 정보를 반환한다", () => {
    // Arrange
    const hasSession = true;

    // Act
    const state = resolveCTAButtonState(hasSession);

    // Assert
    expect(state).toEqual({
      action: "sign-out",
      label: "Sign out",
    });
  });
});
