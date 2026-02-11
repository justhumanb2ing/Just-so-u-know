import { describe, expect, it } from "vitest";
import { buildSocialProfileUrl, normalizeSocialUsername, SOCIAL_PLATFORM_DEFINITIONS } from "@/constants/social-platforms";

describe("social-platforms", () => {
  it("플랫폼 키는 중복 없이 관리된다", () => {
    // Arrange
    const platforms = SOCIAL_PLATFORM_DEFINITIONS.map((platform) => platform.platform);

    // Act
    const uniquePlatformCount = new Set(platforms).size;

    // Assert
    expect(uniquePlatformCount).toBe(platforms.length);
  });

  it("username 템플릿은 username 토큰을 반드시 포함한다", () => {
    // Arrange
    const templates = SOCIAL_PLATFORM_DEFINITIONS.map((platform) => platform.profileUrlTemplate);

    // Act
    const allTemplatesContainToken = templates.every((template) => template.includes("{username}"));

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
});
