import { metadata as release010Metadata } from "@/changelog/0.1.0.mdx";
import { buildChangelogEntries, type RawChangelogEntry } from "@/service/versioning/changelog-schema";

const rawChangelogEntries: RawChangelogEntry[] = [
  {
    sourcePath: "changelog/0.1.0.mdx",
    metadata: release010Metadata,
  },
];

export const changelogEntries = buildChangelogEntries(rawChangelogEntries);
