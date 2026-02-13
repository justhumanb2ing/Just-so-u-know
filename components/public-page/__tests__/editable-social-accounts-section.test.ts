import { describe, expect, test } from "vitest";
import { serializePersistedSocialItems } from "@/components/public-page/editable-social-accounts-section";
import type { SocialPlatform } from "@/constants/social-platforms";

describe("serializePersistedSocialItems", () => {
  test("저장된 플랫폼 식별자 맵을 Drawer 재진입용 초기 아이템 목록으로 변환한다", () => {
    // Arrange
    const identifierByPlatform = new Map<SocialPlatform, string>([
      ["github", "tsuki-dev"],
      ["x", "tsuki_dev"],
    ]);

    // Act
    const serializedItems = serializePersistedSocialItems(identifierByPlatform);

    // Assert
    expect(serializedItems).toEqual([
      { platform: "github", username: "tsuki-dev" },
      { platform: "x", username: "tsuki_dev" },
    ]);
  });

  test("저장된 항목이 없으면 빈 배열을 반환한다", () => {
    // Arrange
    const identifierByPlatform = new Map<SocialPlatform, string>();

    // Act
    const serializedItems = serializePersistedSocialItems(identifierByPlatform);

    // Assert
    expect(serializedItems).toEqual([]);
  });
});
