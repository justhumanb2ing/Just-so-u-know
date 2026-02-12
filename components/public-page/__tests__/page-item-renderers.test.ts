import { describe, expect, test } from "vitest";
import { resolvePageItemDisplayText } from "@/components/public-page/page-item-renderers";
import type { PageItem } from "@/hooks/use-page-item-composer";

function createItem(input: Partial<PageItem>): PageItem {
  return {
    id: "item-1",
    typeCode: "memo",
    sizeCode: "wide-short",
    orderKey: 1,
    data: {},
    createdAt: "2026-02-12T00:00:00.000Z",
    updatedAt: "2026-02-12T00:00:00.000Z",
    ...input,
  };
}

describe("page item renderers", () => {
  test("memo 타입은 content 필드를 우선 렌더링한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "memo",
      data: {
        content: "memo content",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("memo content");
  });

  test("link 타입은 label/title/url 순서로 텍스트를 선택한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "link",
      data: {
        title: "My Link",
        url: "https://example.com",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("My Link");
  });

  test("image 타입은 alt/caption/title/src 순서로 텍스트를 선택한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "image",
      data: {
        alt: "Profile image",
        src: "https://example.com/image.webp",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("Profile image");
  });

  test("미지원 타입은 첫 번째 문자열 primitive를 fallback으로 사용한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "video",
      data: {
        url: "https://example.com/video.mp4",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("https://example.com/video.mp4");
  });
});
