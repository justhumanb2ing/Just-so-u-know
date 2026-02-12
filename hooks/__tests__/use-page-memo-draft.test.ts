import { describe, expect, test } from "vitest";
import { buildPageItemsEndpoint, hasMeaningfulMemoContent, normalizeMemoInput, normalizeMemoSizeCode } from "@/hooks/use-page-memo-draft";

describe("usePageMemoDraft helpers", () => {
  test("memo 입력의 줄바꿈을 \\n 형식으로 정규화한다", () => {
    // Arrange
    const input = "hello\r\nworld\rnext";

    // Act
    const result = normalizeMemoInput(input);

    // Assert
    expect(result).toBe("hello\nworld\nnext");
  });

  test("개행이 포함돼도 유효 텍스트가 있으면 저장 가능으로 판단한다", () => {
    // Arrange
    const input = "Hello\nWorld";

    // Act
    const result = hasMeaningfulMemoContent(input);

    // Assert
    expect(result).toBe(true);
  });

  test("sizeCode가 비정상이면 wide-short로 정규화한다", () => {
    // Arrange
    const sizeCode = "unknown-size";

    // Act
    const result = normalizeMemoSizeCode(sizeCode);

    // Assert
    expect(result).toBe("wide-short");
  });

  test("공백과 개행만 있는 값은 저장 불가로 판단한다", () => {
    // Arrange
    const input = "   \n   ";

    // Act
    const result = hasMeaningfulMemoContent(input);

    // Assert
    expect(result).toBe(false);
  });

  test("저장 API 경로는 handle을 URL 인코딩해 생성한다", () => {
    // Arrange
    const storedHandle = "@hello world";

    // Act
    const result = buildPageItemsEndpoint(storedHandle);

    // Assert
    expect(result).toBe("/api/pages/%40hello%20world/items");
  });
});
