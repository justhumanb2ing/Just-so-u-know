import { describe, expect, test } from "vitest";
import {
  buildPageSocialItemsEndpoint,
  normalizeDeletedSocialPlatforms,
  normalizeSelectedSocialItems,
  parseUpsertPageSocialItemsApiResponse,
} from "@/hooks/use-page-social-accounts";

describe("usePageSocialAccounts helpers", () => {
  test("소셜 계정 저장 API 경로는 handle을 URL 인코딩해 생성한다", () => {
    // Arrange
    const storedHandle = "@hello world";

    // Act
    const result = buildPageSocialItemsEndpoint(storedHandle);

    // Assert
    expect(result).toBe("/api/pages/%40hello%20world/social-items");
  });

  test("선택된 소셜 계정은 빈 식별자를 제외하고 플랫폼 기준으로 병합한다", () => {
    // Arrange
    const items = [
      { platform: "x", username: "  @first  " },
      { platform: "github", username: "   " },
      { platform: "x", username: "  @second  " },
      { platform: "chzzk", username: "  @channel-id  " },
    ];

    // Act
    const result = normalizeSelectedSocialItems(items);

    // Assert
    expect(result).toEqual([
      { platform: "x", username: "second" },
      { platform: "chzzk", username: "@channel-id" },
    ]);
  });

  test("삭제 대상 플랫폼은 중복 없이 정규화한다", () => {
    // Arrange
    const platforms = ["x", "github", "x", "instagram"] as const;

    // Act
    const result = normalizeDeletedSocialPlatforms([...platforms]);

    // Assert
    expect(result).toEqual(["x", "github", "instagram"]);
  });

  test("빈 응답 문자열은 null로 안전 처리한다", () => {
    // Arrange
    const responseText = "";

    // Act
    const result = parseUpsertPageSocialItemsApiResponse(responseText);

    // Assert
    expect(result).toBeNull();
  });

  test("비JSON 응답 문자열은 null로 안전 처리한다", () => {
    // Arrange
    const responseText = "<!doctype html><html></html>";

    // Act
    const result = parseUpsertPageSocialItemsApiResponse(responseText);

    // Assert
    expect(result).toBeNull();
  });
});
