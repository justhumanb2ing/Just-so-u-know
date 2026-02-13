import { SOCIAL_PLATFORM_ICON_MAP } from "@/components/icons/social-platform-icon-map";
import { SOCIAL_PLATFORM_PRESENTATION } from "@/components/public-page/social-platform-presentation";
import { buildSocialProfileUrl, SOCIAL_PLATFORM_BY_ID, type SocialPlatform } from "@/constants/social-platforms";

export type ConnectedSocialItem = {
  platform: string;
  username: string;
};

export type ConnectedSocialLinkItem = {
  key: string;
  href: string;
  label: string;
  Icon: (typeof SOCIAL_PLATFORM_ICON_MAP)[SocialPlatform];
  iconClassName: string;
  iconButtonClassName?: string;
  iconColor?: `#${string}`;
};

function isSocialPlatform(platform: string): platform is SocialPlatform {
  return Object.hasOwn(SOCIAL_PLATFORM_BY_ID, platform);
}

/**
 * 연결된 소셜 아이템 목록을 렌더 가능한 링크 모델로 변환한다.
 * 플랫폼 유효성/식별자 정규화/URL 생성을 한곳에서 처리해 UI 분기를 단순화한다.
 */
export function buildConnectedSocialLinkItems(items: ConnectedSocialItem[]): ConnectedSocialLinkItem[] {
  return items.flatMap((item) => {
    if (!isSocialPlatform(item.platform)) {
      return [];
    }

    const platform = item.platform;
    const href = buildSocialProfileUrl(platform, item.username);

    if (!href) {
      return [];
    }

    return [
      {
        key: `${platform}-${href}`,
        href,
        label: SOCIAL_PLATFORM_BY_ID[platform].label,
        Icon: SOCIAL_PLATFORM_ICON_MAP[platform],
        iconClassName: SOCIAL_PLATFORM_PRESENTATION[platform].iconClassName,
        iconButtonClassName: SOCIAL_PLATFORM_PRESENTATION[platform].iconButtonClassName,
        iconColor: SOCIAL_PLATFORM_PRESENTATION[platform].iconColor,
      },
    ];
  });
}
