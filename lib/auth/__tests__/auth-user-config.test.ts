import { describe, expect, test } from "vitest";

import { AUTH_USER_CONFIG } from "@/lib/auth/user-config";

describe("AUTH_USER_CONFIG", () => {
  test("additionalFields는 user 설정 아래에서 선언된다", () => {
    // Arrange
    const expectedDefaultRole = "user";

    // Act
    const roleField = AUTH_USER_CONFIG.additionalFields.role;

    // Assert
    expect(roleField.defaultValue).toBe(expectedDefaultRole);
    expect(roleField.type).toEqual(["user", "admin"]);
    expect(AUTH_USER_CONFIG.deleteUser.enabled).toBe(true);
  });
});
