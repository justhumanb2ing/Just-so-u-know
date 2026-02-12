import { describe, expect, test } from "vitest";
import {
  buildPageItemsEndpoint,
  hasMeaningfulItemContent,
  normalizeCreatedItem,
  normalizeInitialPageItems,
  normalizeItemInput,
  normalizePageItemSizeCode,
  resolveDraftAfterPersistSuccess,
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
});
