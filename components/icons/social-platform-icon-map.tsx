import type * as React from "react";
import type { SocialPlatform } from "@/constants/social-platforms";
import { BehanceIcon } from "./simple-icons-behance";
import { BuymecoffeeIcon } from "./simple-icons-buymecoffee";
import { ChzzkIcon } from "./simple-icons-chzzk";
import { FigmaIcon } from "./simple-icons-figma";
import { GithubIcon } from "./simple-icons-github";
import { GumroadIcon } from "./simple-icons-gumroad";
import { InstagramIcon } from "./simple-icons-instagram";
import { KoFiIcon } from "./simple-icons-kofi";
import { LinkedinIcon } from "./simple-icons-linkedin";
import { MediumIcon } from "./simple-icons-medium";
import { PatreonIcon } from "./simple-icons-patreon";
import { ProducthuntIcon } from "./simple-icons-producthunt";
import { RedditIcon } from "./simple-icons-reddit";
import { SpotifyIcon } from "./simple-icons-spotify";
import { ThreadsIcon } from "./simple-icons-threads";
import { TikTokIcon } from "./simple-icons-tiktok";
import { TwitchIcon } from "./simple-icons-twitch";
import { XIcon } from "./simple-icons-x";
import { YoutubeIcon } from "./simple-icons-youtube";

export type SocialPlatformIconComponent = React.ComponentType<
  React.SVGProps<SVGSVGElement> & {
    size?: number;
    color?: string;
    strokeWidth?: number;
  }
>;

export const SOCIAL_PLATFORM_ICON_MAP: Record<SocialPlatform, SocialPlatformIconComponent> = {
  behance: BehanceIcon,
  buymeacoffee: BuymecoffeeIcon,
  chzzk: ChzzkIcon,
  figma: FigmaIcon,
  github: GithubIcon,
  gumroad: GumroadIcon,
  instagram: InstagramIcon,
  kofi: KoFiIcon,
  linkedin: LinkedinIcon,
  medium: MediumIcon,
  patreon: PatreonIcon,
  producthunt: ProducthuntIcon,
  reddit: RedditIcon,
  spotify: SpotifyIcon,
  threads: ThreadsIcon,
  tiktok: TikTokIcon,
  twitch: TwitchIcon,
  x: XIcon,
  youtube: YoutubeIcon,
};
