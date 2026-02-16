import { z } from "zod";
import { CURRENT_SERVICE_VERSION, compareSemverVersions, isValidSemverVersion } from "@/service/versioning/policy";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const changelogReleaseTypeSchema = z.enum(["major", "minor", "patch", "pre-release"]);

/**
 * `YYYY-MM-DD` 형식의 날짜 문자열을 엄격하게 검증한다.
 */
export function isIsoDateString(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().startsWith(`${value}T`);
}

export const changelogEntryMetadataSchema = z.object({
  version: z.string().refine((value) => isValidSemverVersion(value), {
    message: "Version must follow semver.",
  }),
  releasedAt: z.string().refine((value) => isIsoDateString(value), {
    message: "releasedAt must follow YYYY-MM-DD.",
  }),
  type: changelogReleaseTypeSchema,
  summary: z.string().trim().min(1, { message: "summary is required." }),
  highlights: z.array(z.string().trim().min(1, { message: "Highlight text is required." })).min(1, {
    message: "At least one highlight is required.",
  }),
});

export type ChangelogEntryMetadata = z.infer<typeof changelogEntryMetadataSchema>;

export interface RawChangelogEntry {
  sourcePath: string;
  metadata: unknown;
}

export interface ChangelogEntry extends ChangelogEntryMetadata {
  sourcePath: string;
  isCurrent: boolean;
}

/**
 * changelog raw 엔트리를 검증하고 최신 순서(배포일, 버전)로 정렬한다.
 */
export function buildChangelogEntries(rawEntries: readonly RawChangelogEntry[]): ChangelogEntry[] {
  const seenVersions = new Set<string>();

  const validatedEntries = rawEntries.map((rawEntry) => {
    const parsedMetadata = changelogEntryMetadataSchema.safeParse(rawEntry.metadata);

    if (!parsedMetadata.success) {
      throw new Error(`Invalid changelog metadata in ${rawEntry.sourcePath}: ${parsedMetadata.error.message}`);
    }

    if (seenVersions.has(parsedMetadata.data.version)) {
      throw new Error(`Duplicated changelog version: ${parsedMetadata.data.version}`);
    }

    seenVersions.add(parsedMetadata.data.version);

    return {
      ...parsedMetadata.data,
      sourcePath: rawEntry.sourcePath,
      isCurrent: parsedMetadata.data.version === CURRENT_SERVICE_VERSION,
    } satisfies ChangelogEntry;
  });

  if (!validatedEntries.some((entry) => entry.version === CURRENT_SERVICE_VERSION)) {
    throw new Error(`Current service version is not documented in changelog: ${CURRENT_SERVICE_VERSION}`);
  }

  return validatedEntries.toSorted((left, right) => {
    const releaseDateDiff = new Date(right.releasedAt).getTime() - new Date(left.releasedAt).getTime();

    if (releaseDateDiff !== 0) {
      return releaseDateDiff;
    }

    return compareSemverVersions(right.version, left.version);
  });
}
