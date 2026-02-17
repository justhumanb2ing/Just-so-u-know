import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE_ALT, SITE_NAME } from "@/config/seo/site";
import { createPublicProfileMetadata } from "@/service/seo/metadata";

describe("service/seo/metadata.ts", () => {
  it("공개 프로필 메타데이터는 handle 라우트 OG 이미지 경로를 사용해야 한다", () => {
    // Arrange
    const input = {
      handle: "@justhumanbeing",
      name: "Just Human Being",
      bio: "Profile bio",
    };

    // Act
    const metadata = createPublicProfileMetadata(input);

    // Assert
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/@justhumanbeing/opengraph-image",
        width: 1200,
        height: 630,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ]);
    expect(metadata.twitter?.images).toEqual(["/@justhumanbeing/opengraph-image"]);
  });

  it("bio가 없으면 기본 description 포맷을 사용해야 한다", () => {
    // Arrange
    const input = {
      handle: "@alpha",
      name: null,
      bio: null,
    };

    // Act
    const metadata = createPublicProfileMetadata(input);

    // Assert
    expect(metadata.description).toBe(`@alpha profile on ${SITE_NAME}.`);
  });
});
