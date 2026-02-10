import { describe, expect, test } from "vitest";

import { LAST_LOGIN_METHOD_COOKIE_NAME, LAST_LOGIN_METHOD_PLUGIN_OPTIONS } from "@/lib/auth/last-login-method";

describe("LAST_LOGIN_METHOD_PLUGIN_OPTIONS", () => {
  test("서버/클라이언트가 공유할 last login method 쿠키 이름을 사용한다", () => {
    // Arrange
    const expectedCookieName = "better-auth.last_used_login_method";

    // Act
    const pluginOptions = LAST_LOGIN_METHOD_PLUGIN_OPTIONS;

    // Assert
    expect(LAST_LOGIN_METHOD_COOKIE_NAME).toBe(expectedCookieName);
    expect(pluginOptions.cookieName).toBe(expectedCookieName);
  });
});
