import { describe, expect, it } from "vitest";
import {
  createNoIndexMetadata,
  createOpenGraphImages,
  createRootMetadata,
  createTemplatedPageTitle,
  createTwitterImages,
} from "@/config/seo/metadata";
import { DEFAULT_OG_IMAGE_ALT, SITE_NAME } from "@/config/seo/site";

describe("config/seo/metadata.ts", () => {
  it("루트 메타데이터에 metadataBase와 기본 OG 이미지가 포함되어야 한다", () => {
    // Arrange
    const expectedMetadataBase = "https://justsouknow.me/";
    const expectedManifestPath = "/manifest.webmanifest";

    // Act
    const metadata = createRootMetadata();

    // Assert
    expect(metadata.metadataBase?.toString()).toBe(expectedMetadataBase);
    expect(metadata.manifest).toBe(expectedManifestPath);
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ]);
  });

  it("커스텀 OG 이미지가 있으면 해당 URL을 우선 사용해야 한다", () => {
    // Arrange
    const customImageUrl = "https://cdn.example.com/custom-og.png";

    // Act
    const openGraphImages = createOpenGraphImages(customImageUrl);
    const twitterImages = createTwitterImages(customImageUrl);

    // Assert
    expect(openGraphImages).toEqual([{ url: customImageUrl }]);
    expect(twitterImages).toEqual([customImageUrl]);
  });

  it("페이지 타이틀 템플릿은 `%s | SITE_NAME` 형태를 반환해야 한다", () => {
    // Arrange
    const pageTitle = "Sign in";

    // Act
    const templatedTitle = createTemplatedPageTitle(pageTitle);

    // Assert
    expect(templatedTitle).toBe(`${pageTitle} | ${SITE_NAME}`);
  });

  it("noindex 메타데이터는 robots 색인 차단 값을 포함해야 한다", () => {
    // Arrange
    const input = {
      title: "Private profile",
      description: "This profile is private.",
    };

    // Act
    const metadata = createNoIndexMetadata(input);

    // Assert
    expect(metadata.title).toBe(input.title);
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    });
  });
});
