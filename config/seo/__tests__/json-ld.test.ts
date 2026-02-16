import { describe, expect, it } from "vitest";
import { createWebSiteJsonLd, stringifyJsonLd } from "@/config/seo/json-ld";

describe("config/seo/json-ld.ts", () => {
  it("JSON-LD 직렬화 시 `<` 문자를 이스케이프해야 한다", () => {
    // Arrange
    const payload = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "<script>alert('xss')</script>",
    };

    // Act
    const serialized = stringifyJsonLd(payload);

    // Assert
    expect(serialized).toContain("\\u003cscript>alert('xss')\\u003c/script>");
    expect(serialized).not.toContain("<script>");
  });

  it("WebSite JSON-LD는 사이트 URL과 식별자를 포함해야 한다", () => {
    // Arrange
    const expectedUrl = "https://tsuki-sigma.vercel.app/";

    // Act
    const websiteJsonLd = createWebSiteJsonLd();

    // Assert
    expect(websiteJsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${expectedUrl}#website`,
      url: expectedUrl,
    });
  });
});
