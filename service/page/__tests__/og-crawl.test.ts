import { describe, expect, test, vi } from "vitest";
import { buildCrawlEndpointUrl, normalizeOgTargetUrl, requestOgCrawlByUrl } from "@/service/page/og-crawl";

describe("og crawl service", () => {
  test("크롤러 endpoint는 static 모드와 timings 파라미터를 구성한다", () => {
    // Arrange
    const targetUrl = "https://example.com/path";

    // Act
    const endpoint = buildCrawlEndpointUrl(targetUrl, true);

    // Assert
    expect(endpoint.searchParams.get("url")).toBe(targetUrl);
    expect(endpoint.searchParams.get("mode")).toBe("static");
    expect(endpoint.searchParams.get("timings")).toBe("1");
  });

  test("프로덕션 모드에서는 timings 파라미터를 생략한다", () => {
    // Arrange
    const targetUrl = "https://example.com/path";

    // Act
    const endpoint = buildCrawlEndpointUrl(targetUrl, false);

    // Assert
    expect(endpoint.searchParams.get("url")).toBe(targetUrl);
    expect(endpoint.searchParams.get("mode")).toBe("static");
    expect(endpoint.searchParams.has("timings")).toBe(false);
  });

  test("입력 URL은 http/https만 허용한다", () => {
    // Arrange
    const ftpUrl = "ftp://example.com/file.txt";

    // Act
    const result = normalizeOgTargetUrl(ftpUrl);

    // Assert
    expect(result).toBeNull();
  });

  test("프로토콜이 없으면 https://를 자동으로 붙여 정규화한다", () => {
    // Arrange
    const rawUrl = "example.com/hello";

    // Act
    const result = normalizeOgTargetUrl(rawUrl);

    // Assert
    expect(result).toBe("https://example.com/hello");
  });

  test("유효하지 않은 링크는 외부 요청 없이 400 실패를 반환한다", async () => {
    // Arrange
    const fetchMock = vi.fn<typeof fetch>();

    // Act
    const result = await requestOgCrawlByUrl("not-a-url", {
      fetchImpl: fetchMock,
      devMode: false,
    });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Invalid URL.",
      status: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("요청 URL에 프로토콜이 없으면 https://를 붙여 크롤러에 전달한다", async () => {
    // Arrange
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          mode: "static",
          fallback: false,
          durationMs: 12,
          data: {
            title: "Example",
            url: "https://example.com",
          },
        }),
        { status: 200 },
      ),
    );

    // Act
    const result = await requestOgCrawlByUrl("example.com", {
      fetchImpl: fetchMock,
      devMode: false,
    });

    // Assert
    expect(result.ok).toBe(true);
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("url")).toBe("https://example.com/");
  });

  test("외부 크롤러의 직접 성공 응답을 CrawlSuccess 형태로 정규화한다", async () => {
    // Arrange
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          mode: "static",
          fallback: false,
          durationMs: 32,
          data: {
            title: "Example",
            url: "https://example.com",
          },
        }),
        { status: 200 },
      ),
    );

    // Act
    const result = await requestOgCrawlByUrl("https://example.com", {
      fetchImpl: fetchMock,
      devMode: false,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected crawl success.");
    }
    expect(result.data.data.title).toBe("Example");
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("mode")).toBe("static");
    expect(requestUrl.searchParams.has("timings")).toBe(false);
  });

  test("캐시 미스 응답에서 cache.ageMs가 없어도 성공으로 파싱한다", async () => {
    // Arrange
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          mode: "static",
          fallback: false,
          durationMs: 818,
          data: {
            title: "Example Domain",
            url: "https://example.com/?nonce=1",
          },
          cache: {
            hit: false,
            ttlMs: 300000,
          },
        }),
        { status: 200 },
      ),
    );

    // Act
    const result = await requestOgCrawlByUrl("https://example.com/?nonce=1", {
      fetchImpl: fetchMock,
      devMode: false,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected crawl success.");
    }
    expect(result.data.cache).toEqual({
      hit: false,
      ttlMs: 300000,
    });
  });

  test("래핑된 성공 응답도 CrawlSuccess 형태로 유지한다", async () => {
    // Arrange
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          data: {
            ok: true,
            mode: "static",
            fallback: false,
            durationMs: 32,
            data: {
              title: "Wrapped Example",
              url: "https://example.com",
            },
          },
        }),
        { status: 200 },
      ),
    );

    // Act
    const result = await requestOgCrawlByUrl("https://example.com", {
      fetchImpl: fetchMock,
      devMode: false,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected wrapped crawl success.");
    }
    expect(result.data.data.title).toBe("Wrapped Example");
  });

  test("실패 응답은 크롤러 에러 메시지와 상태 코드를 유지한다", async () => {
    // Arrange
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          error: "crawl timeout",
          status: 504,
        }),
        { status: 504 },
      ),
    );

    // Act
    const result = await requestOgCrawlByUrl("https://example.com", {
      fetchImpl: fetchMock,
      devMode: false,
    });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "crawl timeout",
      status: 504,
    });
  });
});
