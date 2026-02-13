import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { isMobileWebUserAgent, useIsMobileWebRuntime } from "@/hooks/use-is-mobile-web-runtime";

describe("isMobileWebUserAgent", () => {
  test("User Agent에 모바일 키워드가 포함되면 true를 반환한다", () => {
    // Arrange
    const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)";

    // Act
    const result = isMobileWebUserAgent(userAgent);

    // Assert
    expect(result).toBe(true);
  });

  test("User Agent에 모바일 키워드가 없으면 false를 반환한다", () => {
    // Arrange
    const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)";

    // Act
    const result = isMobileWebUserAgent(userAgent);

    // Assert
    expect(result).toBe(false);
  });

  test("대소문자가 섞여 있어도 모바일 키워드를 인식한다", () => {
    // Arrange
    const userAgent = "Mozilla/5.0 (Linux; ANDROID 14; Pixel 8)";

    // Act
    const result = isMobileWebUserAgent(userAgent);

    // Assert
    expect(result).toBe(true);
  });
});

describe("useIsMobileWebRuntime", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("현재 런타임 User Agent가 모바일이면 true를 반환한다", () => {
    // Arrange
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)");

    // Act
    const { result } = renderHook(() => useIsMobileWebRuntime());

    // Assert
    return waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
