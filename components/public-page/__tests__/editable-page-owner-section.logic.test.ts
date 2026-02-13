import { describe, expect, test } from "vitest";
import { resolveShouldHideOwnerHandle } from "@/components/public-page/editable-page-owner-section";

describe("resolveShouldHideOwnerHandle", () => {
  test("뷰포트가 모바일이면 runtime과 무관하게 true를 반환한다", () => {
    // Arrange
    const params = {
      isMobileViewport: true,
      isMobileWebRuntime: false,
    };

    // Act
    const result = resolveShouldHideOwnerHandle(params);

    // Assert
    expect(result).toBe(true);
  });

  test("모바일 웹 runtime이면 데스크톱 뷰포트여도 true를 반환한다", () => {
    // Arrange
    const params = {
      isMobileViewport: false,
      isMobileWebRuntime: true,
    };

    // Act
    const result = resolveShouldHideOwnerHandle(params);

    // Assert
    expect(result).toBe(true);
  });
});
