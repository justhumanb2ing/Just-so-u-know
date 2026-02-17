import { describe, expect, test } from "vitest";
import { isHandlePathname, resolveCallbackPath, resolveSignupSource } from "@/service/analytics/schema";

describe("analytics schema", () => {
  test("handle 경로 패턴을 판별한다", () => {
    // Arrange
    const pathname = "/@Tester123";

    // Act
    const result = isHandlePathname(pathname);

    // Assert
    expect(result).toBe(true);
  });

  test("일반 경로는 handle 경로로 간주하지 않는다", () => {
    // Arrange
    const pathname = "/sign-in";

    // Act
    const result = isHandlePathname(pathname);

    // Assert
    expect(result).toBe(false);
  });

  test("callback URL에서 path+query만 추출한다", () => {
    // Arrange
    const callbackURL = "https://justsouknow.me/@tester?from=landing#section";

    // Act
    const result = resolveCallbackPath(callbackURL);

    // Assert
    expect(result).toBe("/@tester?from=landing");
  });

  test("handle 경로 callback은 public_page source로 분류한다", () => {
    // Arrange
    const callbackPath = "/@tester";

    // Act
    const result = resolveSignupSource(callbackPath);

    // Assert
    expect(result).toBe("public_page");
  });

  test("handle 이외 callback은 direct source로 분류한다", () => {
    // Arrange
    const callbackPath = "/onboarding";

    // Act
    const result = resolveSignupSource(callbackPath);

    // Assert
    expect(result).toBe("direct");
  });
});
