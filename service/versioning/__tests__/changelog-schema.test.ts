import { describe, expect, test } from "vitest";
import {
  buildChangelogEntries,
  changelogEntryMetadataSchema,
  isIsoDateString,
  type RawChangelogEntry,
} from "@/service/versioning/changelog-schema";
import { CURRENT_SERVICE_VERSION } from "@/service/versioning/policy";

describe("changelog schema", () => {
  test("metadata 스키마는 필수 필드(version, releasedAt, type, summary, highlights)를 검증한다", () => {
    // Arrange
    const payload = {
      version: "0.1.0",
      releasedAt: "2026-02-16",
      type: "minor",
      summary: "Initial release",
      highlights: ["Initial release"],
    };

    // Act
    const result = changelogEntryMetadataSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
  });

  test("releasedAt은 YYYY-MM-DD 형식과 실제 달력 날짜를 동시에 만족해야 한다", () => {
    // Arrange
    const invalidDate = "2026-02-30";

    // Act
    const result = isIsoDateString(invalidDate);

    // Assert
    expect(result).toBe(false);
  });

  test("buildChangelogEntries는 배포일 내림차순으로 정렬한다", () => {
    // Arrange
    const currentVersion = CURRENT_SERVICE_VERSION;
    const rawEntries: RawChangelogEntry[] = [
      {
        sourcePath: `changelog/${currentVersion}.mdx`,
        metadata: {
          version: currentVersion,
          releasedAt: "2026-02-16",
          type: "minor",
          summary: "Current release",
          highlights: ["Current release"],
        },
      },
      {
        sourcePath: "changelog/0.0.9.mdx",
        metadata: {
          version: "0.0.9",
          releasedAt: "2026-02-15",
          type: "patch",
          summary: "Previous release",
          highlights: ["Previous release"],
        },
      },
    ];

    // Act
    const entries = buildChangelogEntries(rawEntries);

    // Assert
    expect(entries.map((entry) => entry.version)).toEqual([currentVersion, "0.0.9"]);
    expect(entries[0]?.isCurrent).toBe(entries[0]?.version === CURRENT_SERVICE_VERSION);
  });

  test("buildChangelogEntries는 중복 버전을 거부한다", () => {
    // Arrange
    const currentVersion = CURRENT_SERVICE_VERSION;
    const rawEntries: RawChangelogEntry[] = [
      {
        sourcePath: `changelog/${currentVersion}-a.mdx`,
        metadata: {
          version: currentVersion,
          releasedAt: "2026-02-16",
          type: "minor",
          summary: "Duplicate A",
          highlights: ["Duplicate A"],
        },
      },
      {
        sourcePath: `changelog/${currentVersion}-b.mdx`,
        metadata: {
          version: currentVersion,
          releasedAt: "2026-02-16",
          type: "minor",
          summary: "Duplicate B",
          highlights: ["Duplicate B"],
        },
      },
    ];

    // Act
    const act = () => buildChangelogEntries(rawEntries);

    // Assert
    expect(act).toThrow("Duplicated changelog version");
  });
});
