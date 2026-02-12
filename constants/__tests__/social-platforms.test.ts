import { describe, expect, it } from "vitest";
import {
  buildSocialProfileUrl,
  getSocialIdentifierType,
  normalizeSocialIdentifier,
  normalizeSocialUsername,
  SOCIAL_PLATFORM_DEFINITIONS,
} from "@/constants/social-platforms";

describe("social-platforms", () => {
  it("플랫폼 키는 중복 없이 관리된다", () => {
    // Arrange
    const platforms = SOCIAL_PLATFORM_DEFINITIONS.map((platform) => platform.platform);

    // Act
    const uniquePlatformCount = new Set(platforms).size;

    // Assert
    expect(uniquePlatformCount).toBe(platforms.length);
  });

  it("플랫폼 템플릿은 식별자 타입에 맞는 토큰을 반드시 포함한다", () => {
    // Arrange
    const tokenValidation = SOCIAL_PLATFORM_DEFINITIONS.map((platform) => {
      const expectedToken = getSocialIdentifierType(platform.platform) === "channelId" ? "{channelId}" : "{username}";

      return platform.profileUrlTemplate.includes(expectedToken);
    });

    // Act
    const allTemplatesContainToken = tokenValidation.every(Boolean);

    // Assert
    expect(allTemplatesContainToken).toBe(true);
  });

  it("username 정규화 시 공백과 선행 @를 제거한다", () => {
    // Arrange
    const rawUsername = "  @@tsuki_dev  ";

    // Act
    const normalizedUsername = normalizeSocialUsername(rawUsername);

    // Assert
    expect(normalizedUsername).toBe("tsuki_dev");
  });

  it("chzzk 식별자는 channelId 규칙(공백 trim만 적용)으로 정규화한다", () => {
    // Arrange
    const rawChannelId = "  @ch-123  ";

    // Act
    const normalizedChannelId = normalizeSocialIdentifier("chzzk", rawChannelId);

    // Assert
    expect(normalizedChannelId).toBe("@ch-123");
  });

  it("플랫폼별 템플릿으로 공개 URL을 생성한다", () => {
    // Arrange
    const platform = "youtube";
    const username = "@my channel";

    // Act
    const profileUrl = buildSocialProfileUrl(platform, username);

    // Assert
    expect(profileUrl).toBe("https://www.youtube.com/@my%20channel");
  });

  it("username이 비어 있으면 null을 반환한다", () => {
    // Arrange
    const platform = "x";
    const username = "   ";

    // Act
    const profileUrl = buildSocialProfileUrl(platform, username);

    // Assert
    expect(profileUrl).toBeNull();
  });

  it("channelId 기반 플랫폼은 channelId 토큰으로 공개 URL을 생성한다", () => {
    // Arrange
    const platform = "chzzk";
    const channelId = "channel_01";

    // Act
    const profileUrl = buildSocialProfileUrl(platform, channelId);

    // Assert
    expect(profileUrl).toBe("https://chzzk.naver.com/channel_01");
  });
});
