export type SocialPlatformDefinition = {
  platform: string;
  label: string;
  brandColor: `#${string}`;
  iconColor?: `#${string}`;
  iconBorderColor?: `#${string}`;
  profileUrlTemplate: string;
  disabled?: boolean;
};

export const SOCIAL_PLATFORM_DEFINITIONS = [
  {
    platform: "x",
    label: "X",
    brandColor: "#000000",
    profileUrlTemplate: "https://x.com/{username}",
  },
  {
    platform: "threads",
    label: "Threads",
    brandColor: "#000000",
    profileUrlTemplate: "https://www.threads.net/@{username}",
  },
  {
    platform: "instagram",
    label: "Instagram",
    brandColor: "#EE90FF",
    profileUrlTemplate: "https://www.instagram.com/{username}",
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    brandColor: "#0A66C2",
    profileUrlTemplate: "https://www.linkedin.com/in/{username}",
  },
  {
    platform: "github",
    label: "GitHub",
    brandColor: "#181717",
    profileUrlTemplate: "https://github.com/{username}",
  },
  {
    platform: "youtube",
    label: "YouTube",
    brandColor: "#FF0000",
    profileUrlTemplate: "https://www.youtube.com/@{username}",
  },
  {
    platform: "figma",
    label: "Figma",
    brandColor: "#383838",
    profileUrlTemplate: "https://www.figma.com/@{username}",
  },
  {
    platform: "behance",
    label: "Behance",
    brandColor: "#0057FF",
    profileUrlTemplate: "https://www.behance.net/{username}",
  },
  {
    platform: "twitch",
    label: "Twitch",
    brandColor: "#8956FB",
    profileUrlTemplate: "https://www.twitch.tv/{username}",
  },
  {
    platform: "spotify",
    label: "Spotify",
    brandColor: "#1ED760",
    profileUrlTemplate: "https://open.spotify.com/user/{username}",
  },
  {
    platform: "medium",
    label: "Medium",
    brandColor: "#12100E",
    profileUrlTemplate: "https://medium.com/@{username}",
  },
  {
    platform: "chzzk",
    label: "Chzzk",
    brandColor: "#00FEA2",
    iconColor: "#111827",
    profileUrlTemplate: "https://chzzk.naver.com/{username}",
  },
  {
    platform: "buymeacoffee",
    label: "BuyMeCoffee",
    brandColor: "#FFDD00",
    iconColor: "#111827",
    profileUrlTemplate: "https://buymeacoffee.com/{username}",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    brandColor: "#FFFFFF",
    iconColor: "#111827",
    iconBorderColor: "#D4D4D8",
    profileUrlTemplate: "https://www.tiktok.com/@{username}",
  },
  {
    platform: "gumroad",
    label: "Gumroad",
    brandColor: "#FF90E8",
    iconColor: "#111827",
    profileUrlTemplate: "https://gumroad.com/{username}",
  },
  {
    platform: "patreon",
    label: "Patreon",
    brandColor: "#F96854",
    profileUrlTemplate: "https://www.patreon.com/{username}",
  },
  {
    platform: "kofi",
    label: "KoFi",
    brandColor: "#72A5F2",
    profileUrlTemplate: "https://ko-fi.com/{username}",
  },
  {
    platform: "reddit",
    label: "Reddit",
    brandColor: "#FF4500",
    profileUrlTemplate: "https://www.reddit.com/user/{username}",
  },
  {
    platform: "producthunt",
    label: "Producthunt",
    brandColor: "#DA552F",
    profileUrlTemplate: "https://www.producthunt.com/@{username}",
  },
] as const satisfies readonly SocialPlatformDefinition[];

export type SocialPlatform = (typeof SOCIAL_PLATFORM_DEFINITIONS)[number]["platform"];

export const SOCIAL_PLATFORM_BY_ID = Object.fromEntries(
  SOCIAL_PLATFORM_DEFINITIONS.map((platform) => [platform.platform, platform]),
) as Record<SocialPlatform, (typeof SOCIAL_PLATFORM_DEFINITIONS)[number]>;

/**
 * 입력 username의 공백과 선행 @를 정규화한다.
 */
export function normalizeSocialUsername(username: string) {
  return username.trim().replace(/^@+/, "");
}

/**
 * 플랫폼 메타데이터와 username을 사용해 공개 프로필 URL을 생성한다.
 */
export function buildSocialProfileUrl(platform: SocialPlatform, username: string) {
  const normalizedUsername = normalizeSocialUsername(username);

  if (!normalizedUsername) {
    return null;
  }

  return SOCIAL_PLATFORM_BY_ID[platform].profileUrlTemplate.replace("{username}", encodeURIComponent(normalizedUsername));
}
