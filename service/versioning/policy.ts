import packageJson from "@/package.json";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

type SemverIdentifier = number | string;

export interface ParsedSemverVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: SemverIdentifier[];
}

export const SERVICE_VERSION_POLICY = {
  scheme: "semver" as const,
  releaseDateReference: "deployment-date" as const,
  prereleaseStrategy: "allow-prerelease-tags" as const,
};

/**
 * SemVer 문자열이 명세에 맞는지 검증한다.
 */
export function isValidSemverVersion(version: string) {
  return SEMVER_PATTERN.test(version);
}

/**
 * SemVer 문자열을 비교 가능한 구조로 파싱한다.
 */
export function parseSemverVersion(version: string): ParsedSemverVersion {
  const matched = version.match(SEMVER_PATTERN);

  if (!matched) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  const prerelease = (matched[4] ?? "")
    .split(".")
    .filter((identifier) => identifier.length > 0)
    .map<SemverIdentifier>((identifier) => {
      if (/^\d+$/.test(identifier)) {
        return Number(identifier);
      }

      return identifier;
    });

  return {
    major: Number(matched[1]),
    minor: Number(matched[2]),
    patch: Number(matched[3]),
    prerelease,
  };
}

/**
 * 두 SemVer 버전을 SemVer precedence 규칙으로 비교한다.
 * 반환값이 양수면 a가 더 크고, 음수면 b가 더 크다.
 */
export function compareSemverVersions(a: string, b: string): number {
  const parsedA = parseSemverVersion(a);
  const parsedB = parseSemverVersion(b);

  if (parsedA.major !== parsedB.major) {
    return parsedA.major - parsedB.major;
  }

  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor - parsedB.minor;
  }

  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch - parsedB.patch;
  }

  if (parsedA.prerelease.length === 0 && parsedB.prerelease.length === 0) {
    return 0;
  }

  if (parsedA.prerelease.length === 0) {
    return 1;
  }

  if (parsedB.prerelease.length === 0) {
    return -1;
  }

  const maxLength = Math.max(parsedA.prerelease.length, parsedB.prerelease.length);

  for (let index = 0; index < maxLength; index += 1) {
    const identifierA = parsedA.prerelease[index];
    const identifierB = parsedB.prerelease[index];

    if (identifierA === undefined) {
      return -1;
    }

    if (identifierB === undefined) {
      return 1;
    }

    if (identifierA === identifierB) {
      continue;
    }

    if (typeof identifierA === "number" && typeof identifierB === "number") {
      return identifierA - identifierB;
    }

    if (typeof identifierA === "number") {
      return -1;
    }

    if (typeof identifierB === "number") {
      return 1;
    }

    return identifierA.localeCompare(identifierB);
  }

  return 0;
}

const packageVersion = packageJson.version;

if (!isValidSemverVersion(packageVersion)) {
  throw new Error(`package.json version must follow semver: ${packageVersion}`);
}

export const CURRENT_SERVICE_VERSION = packageVersion;
