import { describe, expect, test } from "vitest";
import { normalizeStoredHandleFromPath, pageItemCreateSchema } from "@/service/page/schema";

describe("page item schema", () => {
  test("경로 handle을 저장 포맷으로 정규화한다", () => {
    // Arrange
    const pathHandle = "%40TeSter";

    // Act
    const result = normalizeStoredHandleFromPath(pathHandle);

    // Assert
    expect(result).toBe("@tester");
  });

  test("아이템 생성 스키마는 memo content 개행을 공백으로 정규화한다", () => {
    // Arrange
    const payload = {
      type: "memo",
      data: {
        content: "Hello\nWorld",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      type: "memo",
      data: {
        content: "Hello World",
      },
    });
  });

  test("아이템 생성 스키마는 공백만 있는 memo content를 거부한다", () => {
    // Arrange
    const payload = {
      type: "memo",
      data: {
        content: "  \n  ",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });
});
