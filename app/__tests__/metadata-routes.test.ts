import { describe, expect, it, vi } from "vitest";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { findPublicSitemapPages } from "@/service/onboarding/public-page";

vi.mock("@/service/onboarding/public-page", () => ({
  findPublicSitemapPages: vi.fn(),
}));

describe("metadata routes", () => {
  it("sitemap은 공개 SEO 대상 정적 라우트와 공개 handle 라우트를 포함해야 한다", async () => {
    // Arrange
    const findPublicSitemapPagesMock = vi.mocked(findPublicSitemapPages);
    const expectedUrls = [
      "https://tsuki-sigma.vercel.app/",
      "https://tsuki-sigma.vercel.app/changelog",
      "https://tsuki-sigma.vercel.app/sign-in",
      "https://tsuki-sigma.vercel.app/@alpha",
      "https://tsuki-sigma.vercel.app/@bravo",
    ];
    findPublicSitemapPagesMock.mockResolvedValue([
      {
        handle: "@alpha",
        updatedAt: "2026-02-16T00:00:00.000Z",
      },
      {
        handle: "@bravo",
        updatedAt: "2026-02-15T00:00:00.000Z",
      },
    ]);

    // Act
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    // Assert
    expect(urls).toEqual(expectedUrls);
    expect(urls).not.toContain("https://tsuki-sigma.vercel.app/me");
    expect(urls).not.toContain("https://tsuki-sigma.vercel.app/onboarding");
  });

  it("sitemap handle 조회가 실패해도 정적 라우트는 유지해야 한다", async () => {
    // Arrange
    const findPublicSitemapPagesMock = vi.mocked(findPublicSitemapPages);
    const expectedStaticUrls = [
      "https://tsuki-sigma.vercel.app/",
      "https://tsuki-sigma.vercel.app/changelog",
      "https://tsuki-sigma.vercel.app/sign-in",
    ];
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    findPublicSitemapPagesMock.mockRejectedValue(new Error("DB unavailable"));

    // Act
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    // Assert
    expect(urls).toEqual(expectedStaticUrls);
    consoleErrorSpy.mockRestore();
  });

  it("robots는 noindex 대상 내부 경로를 disallow 해야 한다", () => {
    // Arrange
    const expectedDisallow = ["/me", "/onboarding"];

    // Act
    const robotConfig = robots();

    // Assert
    expect(robotConfig.sitemap).toBe("https://tsuki-sigma.vercel.app/sitemap.xml");
    expect(robotConfig.host).toBe("https://tsuki-sigma.vercel.app");
    expect(robotConfig.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: expectedDisallow,
    });
  });

  it("manifest는 앱 이름과 아이콘 정보를 포함해야 한다", () => {
    // Arrange
    const expectedName = "Tsuki";
    const expectedIcon = {
      src: "/favicon.ico",
      sizes: "any",
      type: "image/x-icon",
    };

    // Act
    const manifestData = manifest();

    // Assert
    expect(manifestData.name).toBe(expectedName);
    expect(manifestData.short_name).toBe(expectedName);
    expect(manifestData.icons).toContainEqual(expectedIcon);
    expect(manifestData.start_url).toBe("/");
  });
});
