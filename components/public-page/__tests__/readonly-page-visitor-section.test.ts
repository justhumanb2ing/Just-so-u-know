import { describe, expect, test } from "vitest";
import { buildEditableSectionMotionConfig } from "@/components/public-page/page-motion";
import {
  READONLY_VISITOR_HANDLE_CLASSNAME,
  resolveReadonlySectionMotionConfig,
  resolveShouldRenderReadonlyHandle,
} from "@/components/public-page/readonly-page-visitor-section";

describe("resolveShouldRenderReadonlyHandle", () => {
  test("shouldHideHandle이 false면 handle을 렌더해야 한다", () => {
    // Arrange
    const params = {
      shouldHideHandle: false,
    };

    // Act
    const result = resolveShouldRenderReadonlyHandle(params);

    // Assert
    expect(result).toBe(true);
  });

  test("shouldHideHandle이 true면 handle 렌더를 생략해야 한다", () => {
    // Arrange
    const params = {
      shouldHideHandle: true,
    };

    // Act
    const result = resolveShouldRenderReadonlyHandle(params);

    // Assert
    expect(result).toBe(false);
  });
});

describe("READONLY_VISITOR_HANDLE_CLASSNAME", () => {
  test("모바일 뷰포트에서는 숨기고 md 이상에서만 노출한다", () => {
    // Arrange
    const className = READONLY_VISITOR_HANDLE_CLASSNAME;

    // Act
    const shouldHideOnMobile = className.includes("hidden");
    const shouldShowFromMd = className.includes("md:block");

    // Assert
    expect(shouldHideOnMobile).toBe(true);
    expect(shouldShowFromMd).toBe(true);
  });
});

describe("resolveReadonlySectionMotionConfig", () => {
  test("방문자 섹션 모션은 편집 섹션 모션 구성과 동일해야 한다", () => {
    // Arrange
    const shouldReduceMotion = false;

    // Act
    const readonlyConfig = resolveReadonlySectionMotionConfig(shouldReduceMotion);
    const editableConfig = buildEditableSectionMotionConfig(shouldReduceMotion);

    // Assert
    expect(readonlyConfig).toEqual(editableConfig);
  });
});
