"use client";

import { AtSignIcon, CircleCheckIcon, XIcon as CloseIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Tooltip, TooltipPanel, TooltipTrigger } from "@/components/animate-ui/components/base/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SocialPlatform, SocialPlatformDefinition } from "@/constants/social-platforms";
import { SOCIAL_PLATFORM_DEFINITIONS } from "@/constants/social-platforms";
import { cn } from "@/lib/utils";
import { SOCIAL_PLATFORM_ICON_MAP, type SocialPlatformIconComponent } from "../icons/social-platform-icon-map";
import { ScrollArea } from "../ui/scroll-area";

type SocialPlatformOption = SocialPlatformDefinition & {
  platform: SocialPlatform;
  Icon: SocialPlatformIconComponent;
  iconClassName: string;
  iconButtonClassName?: string;
};

type SocialPlatformPresentation = {
  iconClassName: string;
  iconButtonClassName?: string;
  iconColor?: SocialPlatformDefinition["iconColor"];
};

const SOCIAL_PLATFORM_PRESENTATION: Record<SocialPlatform, SocialPlatformPresentation> = {
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

const SOCIAL_PLATFORM_OPTIONS: SocialPlatformOption[] = SOCIAL_PLATFORM_DEFINITIONS.map(
  (option): SocialPlatformOption => ({
    ...option,
    Icon: SOCIAL_PLATFORM_ICON_MAP[option.platform],
    ...SOCIAL_PLATFORM_PRESENTATION[option.platform],
  }),
);

type SocialPlatformRowProps = {
  option: SocialPlatformOption;
};

/**
 * 브랜드 배경색의 상대 휘도를 계산해 가독성이 높은 텍스트 색상을 반환한다.
 */
function getReadableTextColor(backgroundHexColor: string) {
  const normalizedHex = backgroundHexColor.replace("#", "");
  const expandedHex =
    normalizedHex.length === 3
      ? normalizedHex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalizedHex;

  if (expandedHex.length !== 6) {
    return "#FFFFFF";
  }

  const red = Number.parseInt(expandedHex.slice(0, 2), 16);
  const green = Number.parseInt(expandedHex.slice(2, 4), 16);
  const blue = Number.parseInt(expandedHex.slice(4, 6), 16);

  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#111827" : "#FFFFFF";
}

function SocialPlatformRow({ option }: SocialPlatformRowProps) {
  const { platform, label, Icon, brandColor, iconClassName, iconButtonClassName, iconColor, disabled } = option;
  const [inputValue, setInputValue] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleConfirmInput = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    setIsSubmitted(true);
  };

  const handleEditInput = () => {
    setIsSubmitted(false);
  };

  const readableTextColor = getReadableTextColor(brandColor);

  return (
    <div className="mb-3 flex min-w-0 items-center gap-3">
      <Tooltip delay={100}>
        <TooltipTrigger
          render={
            <Button
              size="icon-xl"
              variant="default"
              disabled={disabled}
              className={cn(disabled && "opacity-50", "size-11! rounded-md shadow-xs", iconButtonClassName)}
            />
          }
        >
          <Icon aria-hidden="true" color={iconColor} className={iconClassName} />
        </TooltipTrigger>
        <TooltipPanel side="top" align="center">
          {label}
        </TooltipPanel>
      </Tooltip>

      <div className="relative min-w-0 flex-1">
        {isSubmitted ? (
          <div
            className="relative flex h-11 w-full items-center overflow-hidden rounded-md border px-3 text-sm"
            style={{
              backgroundColor: brandColor,
              borderColor: brandColor,
              color: readableTextColor,
            }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden pe-8">
              <CircleCheckIcon aria-hidden="true" size={18} className="shrink-0 fill-white" style={{ stroke: brandColor }} />
              <span className="block min-w-0 flex-1 truncate font-medium">{inputValue}</span>
            </div>
            <button
              type="button"
              disabled={disabled}
              aria-label={`Edit ${label} username`}
              onClick={handleEditInput}
              className="absolute inset-y-0 end-3 inline-flex size-6 shrink-0 items-center justify-center self-center rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloseIcon aria-hidden="true" size={16} strokeWidth={3} className="shrink-0" style={{ color: readableTextColor }} />
            </button>
          </div>
        ) : (
          <>
            <Input
              name={`social-${platform}`}
              value={inputValue}
              placeholder="username"
              disabled={disabled}
              autoComplete="off"
              aria-label={`${label} username`}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleConfirmInput}
              className="peer h-11 rounded-md border-none bg-[#F7F7F7] px-3 ps-8 text-sm text-zinc-800 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:ring-zinc-300/50 disabled:opacity-50"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <AtSignIcon aria-hidden="true" size={16} className="text-zinc-700" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 소셜 username 입력 UI를 렌더링하는 편집 섹션.
 * 현재는 저장 로직 없이 입력 필드만 제공한다.
 */
export function EditableSocialAccountsSection() {
  return (
    <section className="phantom-shadow flex h-[820px] max-w-[424px] flex-col rounded-[2.5rem] border p-6 md:p-8">
      <h2 className="font-bold text-xl leading-tight">Add your social platform into your page</h2>
      <div className="flex grow flex-col">
        <ScrollArea className="scrollbar-hide mt-8 h-96 grow border border-none" scrollFade scrollbarHidden>
          {SOCIAL_PLATFORM_OPTIONS.map((option) => (
            <SocialPlatformRow key={option.platform} option={option} />
          ))}
        </ScrollArea>
        <Button type="button" size="xl" className="mt-8 h-14! w-full rounded-full font-semibold text-lg!">
          Add Selected Platforms
        </Button>
      </div>
    </section>
  );
}
