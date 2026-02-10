import { describe, expect, test } from "vitest";
import { isReservedHandle } from "@/service/onboarding/reserved-handles";

describe("reserved handles", () => {
  test("예약어는 true를 반환한다", () => {
    // Arrange
    const input = "onboarding";

    // Act
    const result = isReservedHandle(input);

    // Assert
    expect(result).toBe(true);
  });

  test("예약어가 아니면 false를 반환한다", () => {
    // Arrange
    const input = "tester123";

    // Act
    const result = isReservedHandle(input);

    // Assert
    expect(result).toBe(false);
  });
});
