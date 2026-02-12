import { act, renderHook, waitFor } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { buildOgLookupEndpoint, useOgCrawl } from "@/hooks/use-og-crawl";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useOgCrawl helpers", () => {
  test("OG 조회 endpoint는 입력 URL을 query param으로 인코딩한다", () => {
    // Arrange
    const linkUrl = "https://example.com/path?q=hello world";

    // Act
    const endpoint = buildOgLookupEndpoint(linkUrl);
    const parsed = new URL(endpoint);

    // Assert
    expect(parsed.pathname).toBe("/api/page/og");
    expect(parsed.searchParams.get("url")).toBe(linkUrl);
  });

  test("조회 성공 시 입력값을 초기화하고 success 콜백을 호출한다", async () => {
    // Arrange
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          data: {
            ok: true,
            mode: "static",
            fallback: false,
            durationMs: 10,
            data: {
              title: "Example",
              url: "https://example.com",
            },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useOgCrawl());

    // Act
    act(() => {
      result.current.handleLinkUrlChange({
        target: {
          value: "example.com",
        },
      } as ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleSubmitOgLookup(
        {
          preventDefault: vi.fn(),
        } as unknown as SubmitEvent,
        { onSuccess },
      );
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
    expect(result.current.linkUrl).toBe("");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
