import { describe, expect, test } from "vitest";

import { SOCIAL_PROVIDER_OPTIONS } from "@/components/auth/social-provider-options";
import { SOCIAL_ACCOUNT_LINKING_PROVIDERS } from "@/lib/auth/account-linking";

describe("SOCIAL_PROVIDER_OPTIONS", () => {
  test("모든 provider 옵션은 필수 메타데이터를 가진다", () => {
    expect(SOCIAL_PROVIDER_OPTIONS.length).toBeGreaterThan(0);

    for (const option of SOCIAL_PROVIDER_OPTIONS) {
      expect(option.provider.length).toBeGreaterThan(0);
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.loginOption.length).toBeGreaterThan(0);
      expect(option.brandColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(option.buttonClassName.length).toBeGreaterThan(0);
      expect(typeof option.Icon).toBe("function");
    }
  });

  test("지원하는 소셜 provider 목록에 github가 포함된다", () => {
    const providers = SOCIAL_PROVIDER_OPTIONS.map((option) => option.provider);
    expect(providers).toContain("github");
  });

  test("지원하는 소셜 provider 목록에 naver가 포함된다", () => {
    const providers = SOCIAL_PROVIDER_OPTIONS.map((option) => option.provider);
    expect(providers).toContain("naver");
  });

  test("소셜 provider 옵션 목록은 계정 링크 trusted provider와 동기화된다", () => {
    // Arrange
    const expectedProviders = SOCIAL_ACCOUNT_LINKING_PROVIDERS;

    // Act
    const providers = SOCIAL_PROVIDER_OPTIONS.map((option) => option.provider);

    // Assert
    expect(providers).toEqual(expectedProviders);
  });
});
