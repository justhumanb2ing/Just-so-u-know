import { describe, expect, test } from "vitest";
import {
  isWideShortSizeBlockedForItemType,
  resolveDefaultMapItemSizeCode,
  resolveDefaultMediaItemSizeCode,
  resolveDefaultSectionItemSizeCode,
  resolveReorderTemporaryOffset,
} from "@/service/page/items";

describe("page items reorder helpers", () => {
  test("임시 오프셋은 현재 최대 order_key를 그대로 사용한다", () => {
    // Arrange
    const maxOrderKey = 42;

    // Act
    const result = resolveReorderTemporaryOffset(maxOrderKey, 3);

    // Assert
    expect(result).toBe(42);
  });

  test("최대 order_key가 없으면 0 오프셋을 사용한다", () => {
    // Arrange
    const maxOrderKey = null;

    // Act
    const result = resolveReorderTemporaryOffset(maxOrderKey, 2);

    // Assert
    expect(result).toBe(0);
  });

  test("임시 오프셋 계산 시 int 범위를 넘기면 null을 반환한다", () => {
    // Arrange
    const maxOrderKey = 2147483647;

    // Act
    const result = resolveReorderTemporaryOffset(maxOrderKey, 1);

    // Assert
    expect(result).toBeNull();
  });

  test("map 아이템 기본 size_code는 wide-full을 사용한다", () => {
    // Arrange

    // Act
    const result = resolveDefaultMapItemSizeCode();

    // Assert
    expect(result).toBe("wide-full");
  });

  test("image/video 아이템 기본 size_code는 wide-tall을 사용한다", () => {
    // Arrange

    // Act
    const result = resolveDefaultMediaItemSizeCode();

    // Assert
    expect(result).toBe("wide-tall");
  });

  test("section 아이템 기본 size_code는 wide-short를 사용한다", () => {
    // Arrange

    // Act
    const result = resolveDefaultSectionItemSizeCode();

    // Assert
    expect(result).toBe("wide-short");
  });

  test("image/video 타입은 wide-short를 금지한다", () => {
    // Arrange

    // Act
    const imageBlocked = isWideShortSizeBlockedForItemType("image");
    const videoBlocked = isWideShortSizeBlockedForItemType("video");
    const memoBlocked = isWideShortSizeBlockedForItemType("memo");

    // Assert
    expect(imageBlocked).toBe(true);
    expect(videoBlocked).toBe(true);
    expect(memoBlocked).toBe(false);
  });
});
