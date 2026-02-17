import { act, renderHook } from "@testing-library/react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { buildAbsoluteRouteUrl, useCopyCurrentRouteUrl } from "@/hooks/use-copy-current-route-url";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const mockedUsePathname = vi.mocked(usePathname);
const mockedUseSearchParams = vi.mocked(useSearchParams);
const mockedToastError = vi.mocked(toast.error);

describe("buildAbsoluteRouteUrl", () => {
  test("query/hash 접두어 없이 전달되면 URL 규격에 맞춰 정규화한다", () => {
    // Arrange
    const input = {
      origin: "https://justsouknow.me",
      pathname: "@owner",
      search: "tab=links",
      hash: "profile",
    };

    // Act
    const url = buildAbsoluteRouteUrl(input);

    // Assert
    expect(url).toBe("https://justsouknow.me/@owner?tab=links#profile");
  });

  test("query/hash가 비어 있으면 pathname까지만 반환한다", () => {
    // Arrange
    const input = {
      origin: "https://justsouknow.me",
      pathname: "/@owner",
      search: "",
      hash: "",
    };

    // Act
    const url = buildAbsoluteRouteUrl(input);

    // Assert
    expect(url).toBe("https://justsouknow.me/@owner");
  });
});

describe("useCopyCurrentRouteUrl", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/@owner?tab=links#profile");

    mockedUsePathname.mockReturnValue("/@owner");
    mockedUseSearchParams.mockReturnValue(new URLSearchParams("tab=links") as ReturnType<typeof useSearchParams>);
    mockedToastError.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("현재 라우트 URL을 복사하면 true를 반환한다", async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { result } = renderHook(() => useCopyCurrentRouteUrl());

    // Act
    let copied = false;
    await act(async () => {
      copied = await result.current.copyCurrentRouteUrl();
    });

    // Assert
    const expectedUrl = `${window.location.origin}/@owner?tab=links#profile`;
    expect(result.current.currentRouteUrl).toBe(expectedUrl);
    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith(expectedUrl);
  });

  test("클립보드 복사 실패 시 false를 반환하고 에러 토스트를 노출한다", async () => {
    // Arrange
    const writeText = vi.fn().mockRejectedValue(new Error("permission denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { result } = renderHook(() => useCopyCurrentRouteUrl());

    // Act
    let copied = false;
    await act(async () => {
      copied = await result.current.copyCurrentRouteUrl();
    });

    // Assert
    expect(copied).toBe(false);
    expect(mockedToastError).toHaveBeenCalledWith("Copy failed", {
      description: "Unable to copy the current page URL.",
    });
  });

  test("클립보드 API를 지원하지 않으면 false를 반환하고 안내 토스트를 노출한다", async () => {
    // Arrange
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const { result } = renderHook(() => useCopyCurrentRouteUrl());

    // Act
    let copied = false;
    await act(async () => {
      copied = await result.current.copyCurrentRouteUrl();
    });

    // Assert
    expect(copied).toBe(false);
    expect(mockedToastError).toHaveBeenCalledWith("Clipboard unavailable", {
      description: "Your browser does not support clipboard copy.",
    });
  });
});
