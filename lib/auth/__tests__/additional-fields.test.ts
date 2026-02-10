import { describe, expect, test } from "vitest";

import { AUTH_ADDITIONAL_FIELDS, ROLE_FIELD_VALUES } from "@/lib/auth/additional-fields";

describe("AUTH_ADDITIONAL_FIELDS", () => {
  test("role 필드는 user/admin enum을 가지고 기본값은 user다", () => {
    // Arrange
    const expectedRoleValues = ["user", "admin"];

    // Act
    const roleField = AUTH_ADDITIONAL_FIELDS.role;

    // Assert
    expect(ROLE_FIELD_VALUES).toEqual(expectedRoleValues);
    expect(roleField.type).toEqual(expectedRoleValues);
    expect(roleField.defaultValue).toBe("user");
    expect(roleField.input).toBe(false);
    expect(roleField.required).toBe(false);
  });
});
