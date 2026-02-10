import { describe, expect, test } from "vitest";

import { getLoginMethodLabel, prioritizeSocialOptions } from "@/components/auth/social-login-preferences";
import { SOCIAL_PROVIDER_OPTIONS } from "@/components/auth/social-provider-options";

describe("social-login-preferences", () => {
  test("최근 로그인 방식 라벨을 provider 값으로 변환한다", () => {
    // Arrange
    const method = "google";

    // Act
    const label = getLoginMethodLabel(method);

    // Assert
    expect(label).toBe("Google");
  });

  test("email-password는 이메일 라벨로 변환한다", () => {
    // Arrange
    const method = "email-password";

    // Act
    const label = getLoginMethodLabel(method);

    // Assert
    expect(label).toBe("이메일");
  });

  test("최근 소셜 로그인 방식이 있으면 해당 provider를 맨 앞으로 배치한다", () => {
    // Arrange
    const method = "github";

    // Act
    const orderedProviders = prioritizeSocialOptions(method).map((option) => option.provider);

    // Assert
    expect(orderedProviders[0]).toBe("github");
    expect(orderedProviders).toContain("google");
    expect(orderedProviders).toContain("kakao");
    expect(orderedProviders).toContain("naver");
  });

  test("최근 로그인 방식이 소셜 provider가 아니면 기존 순서를 유지한다", () => {
    // Arrange
    const method = "email-password";

    // Act
    const orderedProviders = prioritizeSocialOptions(method).map((option) => option.provider);
    const originalProviders = SOCIAL_PROVIDER_OPTIONS.map((option) => option.provider);

    // Assert
    expect(orderedProviders).toEqual(originalProviders);
  });
});
