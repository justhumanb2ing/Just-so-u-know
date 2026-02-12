import { describe, expect, test } from "vitest";
import { findVisiblePageSocialItemsByPathHandle, sortVisiblePageSocialItems } from "@/service/page/social-items";

describe("page social items service", () => {
  test("유효하지 않은 경로 handle은 빈 목록을 반환한다", async () => {
    // Arrange
    const invalidPathHandle = "invalid-handle";

    // Act
    const result = await findVisiblePageSocialItemsByPathHandle(invalidPathHandle);

    // Assert
    expect(result).toEqual([]);
  });

  test("소셜 아이템은 sortOrder/createdAt/id 순서로 안정 정렬된다", () => {
    // Arrange
    const items = [
      {
        id: "b",
        platform: "x",
        username: "beta",
        sortOrder: 2,
        createdAt: "2026-02-12T10:10:00.000Z",
        updatedAt: "2026-02-12T10:10:00.000Z",
      },
      {
        id: "c",
        platform: "github",
        username: "gamma",
        sortOrder: 1,
        createdAt: "2026-02-12T10:11:00.000Z",
        updatedAt: "2026-02-12T10:11:00.000Z",
      },
      {
        id: "a",
        platform: "instagram",
        username: "alpha",
        sortOrder: 1,
        createdAt: "2026-02-12T10:10:00.000Z",
        updatedAt: "2026-02-12T10:10:00.000Z",
      },
    ];

    // Act
    const result = sortVisiblePageSocialItems(items);

    // Assert
    expect(result.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });
});
