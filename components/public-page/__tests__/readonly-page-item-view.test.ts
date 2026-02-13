import { describe, expect, it } from "vitest";
import {
  normalizeReadonlyPageItems,
  READONLY_PAGE_ITEM_FALLBACK_FAVICON_SRC,
  type ReadonlyPageItem,
  resolveReadonlyLinkView,
  resolveReadonlyPageItemDisplayText,
} from "@/components/public-page/readonly-page-item-view";
import type { VisiblePageItem } from "@/service/page/items";

describe("readonly page item view", () => {
  it("읽기 전용 아이템 목록은 orderKey 기준으로 정렬되고 sizeCode를 허용값으로 정규화한다", () => {
    // Arrange
    const items: VisiblePageItem[] = [
      {
        id: "b",
        typeCode: "memo",
        sizeCode: "invalid-size",
        orderKey: 2,
        data: { content: "second" },
        createdAt: "2026-02-13T00:00:00.000Z",
        updatedAt: "2026-02-13T00:00:00.000Z",
      },
      {
        id: "a",
        typeCode: "memo",
        sizeCode: "wide-full",
        orderKey: 1,
        data: { content: "first" },
        createdAt: "2026-02-13T00:00:00.000Z",
        updatedAt: "2026-02-13T00:00:00.000Z",
      },
    ];

    // Act
    const result = normalizeReadonlyPageItems(items);

    // Assert
    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
    expect(result[1]?.sizeCode).toBe("wide-short");
  });

  it("link 아이템 뷰 모델은 줄바꿈 title을 정규화하고 favicon 기본값을 보장한다", () => {
    // Arrange
    const item = {
      id: "link-1",
      typeCode: "link",
      sizeCode: "wide-short",
      orderKey: 1,
      data: {
        title: "My\nLink",
        url: " https://example.com ",
      },
      createdAt: "2026-02-13T00:00:00.000Z",
      updatedAt: "2026-02-13T00:00:00.000Z",
    } satisfies ReadonlyPageItem;

    // Act
    const linkView = resolveReadonlyLinkView(item);
    const displayText = resolveReadonlyPageItemDisplayText(item);

    // Assert
    expect(linkView).toMatchObject({
      title: "My Link",
      url: "https://example.com",
      faviconSrc: READONLY_PAGE_ITEM_FALLBACK_FAVICON_SRC,
    });
    expect(displayText).toBe("My\nLink");
  });
});
