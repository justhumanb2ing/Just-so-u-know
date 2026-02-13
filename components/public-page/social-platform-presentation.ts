import type { SocialPlatform, SocialPlatformDefinition } from "@/constants/social-platforms";

export type SocialPlatformPresentation = {
  iconClassName: string;
  iconButtonClassName?: string;
  iconColor?: SocialPlatformDefinition["iconColor"];
};

export const SOCIAL_PLATFORM_PRESENTATION: Record<SocialPlatform, SocialPlatformPresentation> = {
  behance: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#0057ff] hover:bg-[#0057ff]! border-[#0057ff]",
  },
  buymeacoffee: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#FFDD00] hover:bg-[#FFDD00]! border-[#FFDD00]",
  },
  chzzk: {
    iconClassName: "size-7!",
    iconColor: "#00FEA2",
  },
  figma: {
    iconClassName: "size-7!",
    iconButtonClassName: "bg-[#383838] hover:bg-[#383838]! border-[#383838]",
  },
  github: {
    iconClassName: "size-7! fill-white",
  },
  gumroad: {
    iconClassName: "size-7! fill-black",
    iconButtonClassName: "bg-[#FF90E8] hover:bg-[#FF90E8]! border-[#FF90E8]",
  },
  instagram: {
    iconClassName: "size-full!",
    iconButtonClassName: "overflow-hidden border border-transparent inset-shadow-none bg-transparent hover:bg-transparent! shadow-none",
  },
  kofi: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#72A5F2] hover:bg-[#72A5F2]! border-[#72A5F2]",
  },
  linkedin: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#0A66C2] hover:bg-[#0A66C2]! border-[#0A66C2]",
  },
  medium: {
    iconClassName: "size-7! fill-white",
  },
  patreon: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#F96854] hover:bg-[#F96854]! border-[#F96854]",
  },
  producthunt: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#DA552F] hover:bg-[#DA552F]! border-[#DA552F]",
  },
  reddit: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#FF4500] hover:bg-[#FF4500]! border-[#FF4500]",
  },
  spotify: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#1ed760] hover:bg-[#1ed760]! border-[#1ed760]",
  },
  threads: {
    iconClassName: "size-7! fill-white",
  },
  tiktok: {
    iconClassName: "size-7! fill-black",
    iconButtonClassName: "bg-white hover:bg-white! border-border/20",
  },
  twitch: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#8956fb] hover:bg-[#8956fb]! border-[#8956fb]",
  },
  x: {
    iconClassName: "size-7! fill-white",
  },
  youtube: {
    iconClassName: "size-7! fill-white",
    iconButtonClassName: "bg-[#ff0000] hover:bg-[#ff0000]! border-[#ff0000]",
  },
};
