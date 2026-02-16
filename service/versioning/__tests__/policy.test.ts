import { describe, expect, test } from "vitest";
import { CURRENT_SERVICE_VERSION, compareSemverVersions, isValidSemverVersion, parseSemverVersion } from "@/service/versioning/policy";

describe("service version policy", () => {
  test("현재 서비스 버전은 semver 포맷을 만족한다", () => {
    // Arrange
    const currentVersion = CURRENT_SERVICE_VERSION;

    // Act
    const result = isValidSemverVersion(currentVersion);

    // Assert
    expect(result).toBe(true);
  });

  test("semver 파서는 prerelease 식별자를 숫자/문자 타입으로 파싱한다", () => {
    // Arrange
    const version = "1.2.3-rc.1";

    // Act
    const parsed = parseSemverVersion(version);

    // Assert
    expect(parsed).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: ["rc", 1],
    });
  });

  test("정식 릴리즈는 동일 base prerelease보다 precedence가 높다", () => {
    // Arrange
    const stableVersion = "1.2.3";
    const prereleaseVersion = "1.2.3-rc.2";

    // Act
    const result = compareSemverVersions(stableVersion, prereleaseVersion);

    // Assert
    expect(result).toBeGreaterThan(0);
  });

  test("major, minor, patch 순으로 precedence를 비교한다", () => {
    // Arrange
    const lowerVersion = "1.9.9";
    const higherVersion = "2.0.0";

    // Act
    const result = compareSemverVersions(lowerVersion, higherVersion);

    // Assert
    expect(result).toBeLessThan(0);
  });
});
