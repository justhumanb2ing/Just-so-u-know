import { describe, expect, test } from "vitest";
import { onboardingHandleSchema, onboardingStoredHandleSchema, onboardingSubmissionSchema } from "@/service/onboarding/schema";

describe("onboarding schema", () => {
  test("유효한 handle은 소문자로 정규화되어 통과한다", () => {
    // Arrange
    const input = "TeSter123";

    // Act
    const result = onboardingHandleSchema.parse(input);

    // Assert
    expect(result).toBe("tester123");
  });

  test("handle 저장 스키마는 @ 접두를 붙인다", () => {
    // Arrange
    const input = "tester";

    // Act
    const result = onboardingStoredHandleSchema.parse(input);

    // Assert
    expect(result).toBe("@tester");
  });

  test("handle 길이가 3자 미만이면 실패한다", () => {
    // Arrange
    const input = "ab";

    // Act
    const result = onboardingHandleSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  test("handle에 영소문자/숫자 외 문자가 포함되면 실패한다", () => {
    // Arrange
    const input = "test-er";

    // Act
    const result = onboardingHandleSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  test("예약어 handle은 실패한다", () => {
    // Arrange
    const input = "admin";

    // Act
    const result = onboardingHandleSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  test("bio 길이가 200자를 초과하면 실패한다", () => {
    // Arrange
    const payload = {
      handle: "tester",
      verifiedHandle: "tester",
      bio: "a".repeat(201),
    };

    // Act
    const result = onboardingSubmissionSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });

  test("빈 문자열 title/bio/image는 null로 정규화된다", () => {
    // Arrange
    const payload = {
      handle: "tester",
      verifiedHandle: "tester",
      title: "",
      bio: "",
      image: "",
    };

    // Act
    const result = onboardingSubmissionSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      handle: "tester",
      verifiedHandle: "tester",
      title: null,
      bio: null,
      image: null,
    });
  });
});
