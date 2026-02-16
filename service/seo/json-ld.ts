import type { JsonLdObject } from "@/config/seo/json-ld";
import { createAbsoluteUrl } from "@/config/seo/metadata";
import { buildSocialProfileUrl, SOCIAL_PLATFORM_DEFINITIONS, type SocialPlatform } from "@/constants/social-platforms";

const socialPlatformSet = new Set<SocialPlatform>(SOCIAL_PLATFORM_DEFINITIONS.map((definition) => definition.platform));

function isSocialPlatform(platform: string): platform is SocialPlatform {
  return socialPlatformSet.has(platform as SocialPlatform);
}

function isSupportedSocialItem(item: ProfileSocialItemInput): item is ProfileSocialItemInput & { platform: SocialPlatform } {
  return isSocialPlatform(item.platform);
}

export type ProfileSocialItemInput = {
  platform: string;
  username: string;
};

export type PublicProfileJsonLdInput = {
  handle: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  socialItems: ProfileSocialItemInput[];
};

/**
 * 공개 프로필 페이지 구조화 데이터(ProfilePage + Person)를 생성한다.
 */
export function createPublicProfileJsonLd({ handle, name, bio, image, socialItems }: PublicProfileJsonLdInput): JsonLdObject {
  const profileUrl = createAbsoluteUrl(`/${handle}`);
  const siteUrl = createAbsoluteUrl("/");
  const displayName = name?.trim() || handle;
  const description = bio?.trim() || `${displayName} profile`;
  const sameAs = socialItems
    .filter(isSupportedSocialItem)
    .map((item) => buildSocialProfileUrl(item.platform, item.username))
    .filter((value): value is string => Boolean(value));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${profileUrl}#profile-page`,
        url: profileUrl,
        name: `${displayName} profile`,
        description,
        isPartOf: {
          "@id": `${siteUrl}#website`,
        },
        mainEntity: {
          "@id": `${profileUrl}#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${profileUrl}#person`,
        identifier: handle,
        name: displayName,
        description,
        url: profileUrl,
        image: image ?? undefined,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
      },
    ],
  };
}
