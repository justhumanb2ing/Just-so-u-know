import { describe, expect, test } from "vitest";
import {
  buildPageItemEndpoint,
  buildPageItemsEndpoint,
  hasMeaningfulItemContent,
  normalizeCreatedItem,
  normalizeInitialPageItems,
  normalizeItemInput,
  normalizeLinkTitleInput,
  normalizePageItemSizeCode,
  removePageItemById,
  resolveDraftAfterPersistSuccess,
  resolveLinkItemCreatePayloadFromCrawl,
  resolveLinkItemTitle,
  resolveMemoItemContent,
  restoreRemovedPageItem,
  updateLinkItemTitle,
  updateMemoItemContent,
  updatePageItemSize,
} from "@/hooks/use-page-item-composer";

describe("usePageItemComposer helpers", () => {
  test("아이템 입력의 줄바꿈을 \\n 형식으로 정규화한다", () => {
    // Arrange
    const input = "hello\r\nworld\rnext";

    // Act
    const result = normalizeItemInput(input);

    // Assert
    expect(result).toBe("hello\nworld\nnext");
  });

  test("link title 입력은 줄바꿈을 공백으로 정규화한다", () => {
    // Arrange
    const input = "hello\r\nworld\nnext";

    // Act
    const result = normalizeLinkTitleInput(input);

    // Assert
    expect(result).toBe("hello world next");
  });

  test("공백과 개행만 있는 값은 저장 불가로 판단한다", () => {
    // Arrange
    const input = "  \n  ";

    // Act
    const result = hasMeaningfulItemContent(input);

    // Assert
    expect(result).toBe(false);
  });

  test("sizeCode가 비정상이면 wide-short로 정규화한다", () => {
    // Arrange
    const sizeCode = "unknown-size";

    // Act
    const result = normalizePageItemSizeCode(sizeCode);

    // Assert
    expect(result).toBe("wide-short");
  });

  test("저장 API 경로는 handle을 URL 인코딩해 생성한다", () => {
    // Arrange
    const storedHandle = "@hello world";

    // Act
    const result = buildPageItemsEndpoint(storedHandle);

    // Assert
    expect(result).toBe("/api/pages/%40hello%20world/items");
  });

  test("아이템 수정 API 경로는 handle/itemId를 URL 인코딩해 생성한다", () => {
    // Arrange
    const storedHandle = "@hello world";
    const itemId = "item/1";

    // Act
    const result = buildPageItemEndpoint(storedHandle, itemId);

    // Assert
    expect(result).toBe("/api/pages/%40hello%20world/items/item%2F1");
  });

  test("초기 아이템 목록은 sizeCode를 정규화하고 orderKey 기준으로 정렬한다", () => {
    // Arrange
    const items = [
      {
        id: "item-2",
        typeCode: "memo",
        sizeCode: "invalid",
        orderKey: 2,
        data: { content: "second" },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
      {
        id: "item-1",
        typeCode: "link",
        sizeCode: "wide-tall",
        orderKey: 1,
        data: { url: "https://example.com" },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
    ];

    // Act
    const result = normalizeInitialPageItems(items);

    // Assert
    expect(result.map((item) => item.id)).toEqual(["item-1", "item-2"]);
    expect(result[1]?.sizeCode).toBe("wide-short");
  });

  test("생성 응답 정규화 시 type/orderKey 누락값에 기본값을 적용한다", () => {
    // Arrange
    const createdItem = {
      id: "item-1",
      typeCode: 123,
      sizeCode: "invalid",
      orderKey: "not-number",
      data: { content: "hello" },
      createdAt: "2026-02-12T00:00:00.000Z",
      updatedAt: "2026-02-12T00:00:00.000Z",
    };

    // Act
    const result = normalizeCreatedItem(createdItem);

    // Assert
    expect(result.typeCode).toBe("memo");
    expect(result.sizeCode).toBe("wide-short");
    expect(result.orderKey).toBe(Number.MAX_SAFE_INTEGER);
  });

  test("아이템 저장 성공 시 동일 draft id는 제거한다", () => {
    // Arrange
    const prevDraft = {
      id: "draft-1",
      content: "hello",
      hasUserInput: true,
      isSaving: true,
    };

    // Act
    const result = resolveDraftAfterPersistSuccess(prevDraft, "draft-1");

    // Assert
    expect(result).toBeNull();
  });

  test("memo content 추출 시 줄바꿈을 \\n으로 정규화한다", () => {
    // Arrange
    const item = {
      id: "item-1",
      typeCode: "memo",
      sizeCode: "wide-short",
      orderKey: 1,
      data: {
        content: "Hello\r\nWorld",
      },
      createdAt: "2026-02-12T00:00:00.000Z",
      updatedAt: "2026-02-12T00:00:00.000Z",
    } as const;

    // Act
    const result = resolveMemoItemContent(item);

    // Assert
    expect(result).toBe("Hello\nWorld");
  });

  test("link title 추출 시 줄바꿈을 공백으로 정규화한다", () => {
    // Arrange
    const item = {
      id: "item-1",
      typeCode: "link",
      sizeCode: "wide-short",
      orderKey: 1,
      data: {
        title: "Hello\r\nWorld",
      },
      createdAt: "2026-02-12T00:00:00.000Z",
      updatedAt: "2026-02-12T00:00:00.000Z",
    } as const;

    // Act
    const result = resolveLinkItemTitle(item);

    // Assert
    expect(result).toBe("Hello World");
  });

  test("memo content 수정 시 대상 memo만 낙관적으로 갱신한다", () => {
    // Arrange
    const items = [
      {
        id: "item-1",
        typeCode: "memo",
        sizeCode: "wide-short",
        orderKey: 1,
        data: {
          content: "before",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
      {
        id: "item-2",
        typeCode: "link",
        sizeCode: "wide-short",
        orderKey: 2,
        data: {
          url: "https://example.com",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
    ];

    // Act
    const result = updateMemoItemContent(items, "item-1", "after");

    // Assert
    expect(result[0]?.data).toEqual({
      content: "after",
    });
    expect(result[1]).toEqual(items[1]);
  });

  test("link title 수정 시 대상 link만 낙관적으로 갱신한다", () => {
    // Arrange
    const items = [
      {
        id: "item-1",
        typeCode: "link",
        sizeCode: "wide-short",
        orderKey: 1,
        data: {
          title: "before",
          url: "https://example.com",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
      {
        id: "item-2",
        typeCode: "memo",
        sizeCode: "wide-short",
        orderKey: 2,
        data: {
          content: "memo",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
    ];

    // Act
    const result = updateLinkItemTitle(items, "item-1", "after");

    // Assert
    expect((result[0]?.data as { title: string }).title).toBe("after");
    expect(result[1]).toEqual(items[1]);
  });

  test("OG 응답 payload 정규화는 data.url을 저장 기준으로 사용한다", () => {
    // Arrange
    const crawlResponse = {
      ok: true,
      mode: "static",
      fallback: false,
      durationMs: 12,
      data: {
        title: "Example Title",
        url: "https://example.com/path",
        favicon: "https://example.com/favicon.ico",
      },
    } as const;

    // Act
    const result = resolveLinkItemCreatePayloadFromCrawl(crawlResponse);

    // Assert
    expect(result).toEqual({
      title: "Example Title",
      url: "https://example.com/path",
      favicon: "https://example.com/favicon.ico",
    });
  });

  test("OG 응답 title이 비어있으면 링크 저장 payload를 만들지 않는다", () => {
    // Arrange
    const crawlResponse = {
      ok: true,
      mode: "static",
      fallback: false,
      durationMs: 12,
      data: {
        title: "   ",
        url: "https://example.com/path",
      },
    } as const;

    // Act
    const result = resolveLinkItemCreatePayloadFromCrawl(crawlResponse);

    // Assert
    expect(result).toBeNull();
  });

  test("sizeCode 수정 시 대상 아이템만 낙관적으로 갱신한다", () => {
    // Arrange
    const items = [
      {
        id: "item-1",
        typeCode: "memo",
        sizeCode: "wide-short",
        orderKey: 1,
        data: {
          content: "before",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
      {
        id: "item-2",
        typeCode: "link",
        sizeCode: "wide-full",
        orderKey: 2,
        data: {
          url: "https://example.com",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
    ] as const;

    // Act
    const result = updatePageItemSize([...items], "item-1", "wide-tall");

    // Assert
    expect(result[0]?.sizeCode).toBe("wide-tall");
    expect(result[1]).toEqual(items[1]);
  });

  test("아이템 제거 시 제거된 아이템과 남은 목록을 함께 반환한다", () => {
    // Arrange
    const items = [
      {
        id: "item-1",
        typeCode: "memo",
        sizeCode: "wide-short",
        orderKey: 1,
        data: {
          content: "first",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
      {
        id: "item-2",
        typeCode: "link",
        sizeCode: "wide-short",
        orderKey: 2,
        data: {
          url: "https://example.com",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
    ];

    // Act
    const result = removePageItemById(items, "item-1");

    // Assert
    expect(result.nextItems).toEqual([items[1]]);
    expect(result.removedItem).toEqual(items[0]);
  });

  test("삭제 실패 복구 시 제거 아이템을 orderKey 기준으로 다시 정렬해 삽입한다", () => {
    // Arrange
    const removedItem = {
      id: "item-1",
      typeCode: "memo",
      sizeCode: "wide-short",
      orderKey: 1,
      data: {
        content: "first",
      },
      createdAt: "2026-02-12T00:00:00.000Z",
      updatedAt: "2026-02-12T00:00:00.000Z",
    } as const;
    const items = [
      {
        id: "item-3",
        typeCode: "memo",
        sizeCode: "wide-short",
        orderKey: 3,
        data: {
          content: "third",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
      {
        id: "item-2",
        typeCode: "memo",
        sizeCode: "wide-short",
        orderKey: 2,
        data: {
          content: "second",
        },
        createdAt: "2026-02-12T00:00:00.000Z",
        updatedAt: "2026-02-12T00:00:00.000Z",
      },
    ];

    // Act
    const result = restoreRemovedPageItem(items, removedItem);

    // Assert
    expect(result.map((item) => item.id)).toEqual(["item-1", "item-2", "item-3"]);
  });
});
