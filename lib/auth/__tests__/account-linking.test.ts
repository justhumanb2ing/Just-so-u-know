import { describe, expect, test } from "vitest";

import { ACCOUNT_LINKING_CONFIG, ACCOUNT_LINKING_TRUSTED_PROVIDERS } from "@/lib/auth/account-linking";

describe("ACCOUNT_LINKING_CONFIG", () => {
  test("동일 이메일 기준 계정 링크를 위해 신뢰 provider를 명시한다", () => {
    // Arrange
    const expectedProviders = ["email-password", "google", "github", "kakao", "naver"];

    // Act
    const providers = ACCOUNT_LINKING_TRUSTED_PROVIDERS;

    // Assert
    expect(ACCOUNT_LINKING_CONFIG.enabled).toBe(true);
    expect(ACCOUNT_LINKING_CONFIG.allowDifferentEmails).toBe(false);
    expect(providers).toEqual(expectedProviders);
    expect(ACCOUNT_LINKING_CONFIG.trustedProviders).toEqual(expectedProviders);
  });
});
