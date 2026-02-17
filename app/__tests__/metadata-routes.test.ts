import { describe, expect, it, vi } from "vitest";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_DEFAULT_DESCRIPTION, SITE_NAME } from "@/config/seo/site";
import { findPublicSitemapPages } from "@/service/onboarding/public-page";

vi.mock("@/service/onboarding/public-page", () => ({
  findPublicSitemapPages: vi.fn(),
}));

describe("metadata routes", () => {
  it("sitemap은 공개 SEO 대상 정적 라우트와 공개 handle 라우트를 포함해야 한다", async () => {
    // Arrange
    const findPublicSitemapPagesMock = vi.mocked(findPublicSitemapPages);
    const expectedUrls = [
      "https://justsouknow.me/",
      "https://justsouknow.me/changelog",
      "https://justsouknow.me/sign-in",
      "https://justsouknow.me/@alpha",
      "https://justsouknow.me/@bravo",
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
    expect(urls).not.toContain("https://justsouknow.me/me");
    expect(urls).not.toContain("https://justsouknow.me/onboarding");
  });

  it("sitemap handle 조회가 실패해도 정적 라우트는 유지해야 한다", async () => {
    // Arrange
    const findPublicSitemapPagesMock = vi.mocked(findPublicSitemapPages);
    const expectedStaticUrls = ["https://justsouknow.me/", "https://justsouknow.me/changelog", "https://justsouknow.me/sign-in"];
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
    expect(robotConfig.sitemap).toBe("https://justsouknow.me/sitemap.xml");
    expect(robotConfig.host).toBe("https://justsouknow.me");
    expect(robotConfig.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: expectedDisallow,
    });
  });

  it("manifest는 웹매니페스트 아이콘/테마 구성을 포함해야 한다", () => {
    // Arrange
    const expectedName = SITE_NAME;
    const expectedDescription = SITE_DEFAULT_DESCRIPTION;
    const expectedIcons = [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ];

    // Act
    const manifestData = manifest();

    // Assert
    expect(manifestData.name).toBe(expectedName);
    expect(manifestData.short_name).toBe(expectedName);
    expect(manifestData.description).toBe(expectedDescription);
    expect(manifestData.start_url).toBe("/");
    expect(manifestData.id).toBe("/");
    expect(manifestData.scope).toBe("/");
    expect(manifestData.lang).toBe("en-US");
    expect(manifestData.display).toBe("standalone");
    expect(manifestData.background_color).toBe("#ffffff");
    expect(manifestData.theme_color).toBe("#ffffff");
    expect(manifestData.icons).toEqual(expectedIcons);
  });
});
