"use client";

import { AtSignIcon, CircleCheckIcon, XIcon as CloseIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tooltip, TooltipPanel, TooltipTrigger } from "@/components/animate-ui/components/base/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SocialPlatform, SocialPlatformDefinition } from "@/constants/social-platforms";
import {
  getSocialIdentifierPlaceholder,
  normalizeSocialIdentifier,
  SOCIAL_PLATFORM_BY_ID,
  SOCIAL_PLATFORM_DEFINITIONS,
} from "@/constants/social-platforms";
import { usePageSocialAccounts } from "@/hooks/use-page-social-accounts";
import { cn } from "@/lib/utils";
import { SOCIAL_PLATFORM_ICON_MAP, type SocialPlatformIconComponent } from "../icons/social-platform-icon-map";
import { ScrollArea } from "../ui/scroll-area";
import { SOCIAL_PLATFORM_PRESENTATION } from "./social-platform-presentation";

type SocialPlatformOption = SocialPlatformDefinition & {
  platform: SocialPlatform;
  Icon: SocialPlatformIconComponent;
  iconClassName: string;
  iconButtonClassName?: string;
  iconColor?: SocialPlatformDefinition["iconColor"];
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
  initialIdentifier: string;
  pendingDelete?: boolean;
  disabled?: boolean;
  onCommit: (platform: SocialPlatform, identifier: string) => void;
  onUncommit: (platform: SocialPlatform, currentIdentifier: string) => void;
  onDraftChange: (platform: SocialPlatform, identifier: string) => void;
};

export type EditableSocialAccountInitialItem = {
  platform: string;
  username: string;
};

type EditableSocialAccountsSectionProps = {
  handle: string;
  initialItems?: EditableSocialAccountInitialItem[];
  onPersistedItemsChange?: (items: EditableSocialAccountInitialItem[]) => void;
  onSaveSuccess?: () => void;
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

/**
 * 서버에서 받은 소셜 계정을 플랫폼 기준으로 병합해, 각 플랫폼의 첫 번째 식별자만 초기값으로 사용한다.
 */
function buildInitialIdentifierByPlatform(initialItems: EditableSocialAccountInitialItem[]) {
  const identifierByPlatform = new Map<SocialPlatform, string>();

  for (const item of initialItems) {
    if (!Object.hasOwn(SOCIAL_PLATFORM_BY_ID, item.platform)) {
      continue;
    }

    const platform = item.platform as SocialPlatform;

    if (identifierByPlatform.has(platform)) {
      continue;
    }

    const normalizedIdentifier = normalizeSocialIdentifier(platform, item.username);

    if (!normalizedIdentifier) {
      continue;
    }

    identifierByPlatform.set(platform, normalizedIdentifier);
  }

  return identifierByPlatform;
}

/**
 * 저장된 플랫폼별 식별자 맵을 Drawer 재진입 시 재사용 가능한 초기 아이템 포맷으로 직렬화한다.
 */
export function serializePersistedSocialItems(identifierByPlatform: Map<SocialPlatform, string>): EditableSocialAccountInitialItem[] {
  return Array.from(identifierByPlatform, ([platform, username]) => ({
    platform,
    username,
  }));
}

function SocialPlatformRow({
  option,
  initialIdentifier,
  pendingDelete,
  disabled,
  onCommit,
  onUncommit,
  onDraftChange,
}: SocialPlatformRowProps) {
  const { platform, label, Icon, brandColor, iconClassName, iconButtonClassName, iconColor, disabled: optionDisabled } = option;
  const identifierPlaceholder = getSocialIdentifierPlaceholder(platform);
  const normalizedInitialIdentifier = normalizeSocialIdentifier(platform, initialIdentifier);
  const [inputValue, setInputValue] = useState(normalizedInitialIdentifier);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(normalizedInitialIdentifier));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isRowDisabled = Boolean(disabled || optionDisabled);
  const hasInputValue = inputValue.trim().length > 0;

  const handleSubmitInput = () => {
    const normalizedIdentifier = normalizeSocialIdentifier(platform, inputValue);

    if (!normalizedIdentifier) {
      return;
    }

    setInputValue(normalizedIdentifier);
    setIsSubmitted(true);
    onCommit(platform, normalizedIdentifier);
  };

  const handleConfirmInput = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    handleSubmitInput();
  };

  const handleEditInput = () => {
    setIsSubmitted(false);
    onUncommit(platform, inputValue);
    requestAnimationFrame(() => {
      const inputElement = inputRef.current;
      if (!inputElement) {
        return;
      }

      inputElement.focus();
      const cursorPosition = inputElement.value.length;
      inputElement.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const readableTextColor = getReadableTextColor(brandColor);

  return (
    <div className="mb-3">
      <div className="flex min-w-0 items-center gap-3">
        <Tooltip delay={100}>
          <TooltipTrigger
            render={
              <Button
                size="icon-lg"
                variant="default"
                disabled={isRowDisabled}
                className={cn(isRowDisabled && "opacity-50", "phantom-border size-11! rounded-md shadow-xs", iconButtonClassName)}
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
                <CircleCheckIcon
                  aria-hidden="true"
                  size={18}
                  className="shrink-0 fill-white"
                  style={{ stroke: brandColor === "#FFFFFF" ? "#000000" : brandColor }}
                />
                <span className="block min-w-0 flex-1 truncate font-medium">{inputValue}</span>
              </div>
              <button
                type="button"
                disabled={isRowDisabled}
                aria-label={`Edit ${label} ${identifierPlaceholder}`}
                onClick={handleEditInput}
                className="absolute inset-y-0 end-3 inline-flex size-6 shrink-0 items-center justify-center self-center rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloseIcon aria-hidden="true" size={16} strokeWidth={3} className="shrink-0" style={{ color: readableTextColor }} />
              </button>
            </div>
          ) : (
            <>
              <Input
                ref={inputRef}
                name={`social-${platform}`}
                value={inputValue}
                placeholder={identifierPlaceholder}
                disabled={isRowDisabled}
                autoComplete="off"
                aria-label={`${label} ${identifierPlaceholder}`}
                onChange={(event) => {
                  const nextInputValue = event.target.value;
                  setInputValue(nextInputValue);
                  onDraftChange(platform, nextInputValue);
                }}
                onKeyDown={handleConfirmInput}
                className={cn(
                  "peer h-11 rounded-md border-none bg-[#F7F7F7] px-3 ps-8 text-sm text-zinc-800 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:ring-zinc-300/50 disabled:opacity-50",
                  hasInputValue && "pe-15",
                )}
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <AtSignIcon aria-hidden="true" size={16} className="text-zinc-700" />
              </div>
              {hasInputValue ? (
                <Button
                  type="button"
                  size="xs"
                  disabled={isRowDisabled}
                  aria-label={`Get ${label} ${identifierPlaceholder}`}
                  onClick={handleSubmitInput}
                  className="phantom-border absolute inset-y-0 end-2 my-auto h-7 rounded-sm px-2.5 text-xs shadow-xs"
                >
                  Get
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
      {pendingDelete ? <p className="mt-1 pl-14 text-[11px] text-amber-600">Will be removed on save</p> : null}
    </div>
  );
}

/**
 * 소셜 식별자 입력 UI를 렌더링하는 편집 섹션.
 * Enter/Get으로 확정한 플랫폼을 Add Selected Platforms에서 일괄 저장한다.
 */
export function EditableSocialAccountsSection({
  handle,
  initialItems = [],
  onPersistedItemsChange,
  onSaveSuccess,
}: EditableSocialAccountsSectionProps) {
  const initialIdentifierByPlatform = useMemo(() => buildInitialIdentifierByPlatform(initialItems), [initialItems]);
  const [persistedIdentifierByPlatform, setPersistedIdentifierByPlatform] = useState<Map<SocialPlatform, string>>(
    () => new Map(initialIdentifierByPlatform),
  );
  const [selectedIdentifierByPlatform, setSelectedIdentifierByPlatform] = useState<Map<SocialPlatform, string>>(
    () => new Map(initialIdentifierByPlatform),
  );
  const [draftIdentifierByPlatform, setDraftIdentifierByPlatform] = useState<Map<SocialPlatform, string>>(new Map());
  const { isSaving, saveSocialPlatformChanges } = usePageSocialAccounts({ handle });

  const handleCommit = useCallback((platform: SocialPlatform, identifier: string) => {
    setSelectedIdentifierByPlatform((prevState) => {
      const nextState = new Map(prevState);
      nextState.set(platform, identifier);
      return nextState;
    });
    setDraftIdentifierByPlatform((prevState) => {
      if (!prevState.has(platform)) {
        return prevState;
      }

      const nextState = new Map(prevState);
      nextState.delete(platform);
      return nextState;
    });
  }, []);

  const handleUncommit = useCallback((platform: SocialPlatform, currentIdentifier: string) => {
    setSelectedIdentifierByPlatform((prevState) => {
      if (!prevState.has(platform)) {
        return prevState;
      }

      const nextState = new Map(prevState);
      nextState.delete(platform);
      return nextState;
    });
    setDraftIdentifierByPlatform((prevState) => {
      const nextState = new Map(prevState);
      nextState.set(platform, normalizeSocialIdentifier(platform, currentIdentifier));
      return nextState;
    });
  }, []);

  const handleDraftChange = useCallback((platform: SocialPlatform, identifier: string) => {
    setDraftIdentifierByPlatform((prevState) => {
      const nextState = new Map(prevState);
      nextState.set(platform, normalizeSocialIdentifier(platform, identifier));
      return nextState;
    });
  }, []);

  const upsertItemsToSave = useMemo(
    () =>
      Array.from(selectedIdentifierByPlatform, ([platform, username]) => ({
        platform,
        username,
      })).filter((item) => persistedIdentifierByPlatform.get(item.platform) !== item.username),
    [persistedIdentifierByPlatform, selectedIdentifierByPlatform],
  );
  const deletePlatformSet = useMemo(() => {
    const nextSet = new Set<SocialPlatform>();

    for (const [platform, draftIdentifier] of draftIdentifierByPlatform) {
      if (draftIdentifier.length > 0) {
        continue;
      }

      if (!persistedIdentifierByPlatform.has(platform)) {
        continue;
      }

      nextSet.add(platform);
    }

    return nextSet;
  }, [draftIdentifierByPlatform, persistedIdentifierByPlatform]);
  const deletePlatformsToSave = useMemo(() => Array.from(deletePlatformSet), [deletePlatformSet]);
  const hasPendingChanges = upsertItemsToSave.length > 0 || deletePlatformsToSave.length > 0;

  const handleSaveSelectedPlatforms = useCallback(async () => {
    const isSaved = await saveSocialPlatformChanges({
      upserts: upsertItemsToSave,
      deletes: deletePlatformsToSave,
    });

    if (!isSaved) {
      return;
    }

    setPersistedIdentifierByPlatform((prevState) => {
      const nextState = new Map(prevState);

      for (const item of upsertItemsToSave) {
        nextState.set(item.platform, item.username);
      }
      for (const platform of deletePlatformsToSave) {
        nextState.delete(platform);
      }

      return nextState;
    });

    onSaveSuccess?.();
  }, [deletePlatformsToSave, onSaveSuccess, saveSocialPlatformChanges, upsertItemsToSave]);

  useEffect(() => {
    if (!onPersistedItemsChange) {
      return;
    }

    onPersistedItemsChange(serializePersistedSocialItems(persistedIdentifierByPlatform));
  }, [onPersistedItemsChange, persistedIdentifierByPlatform]);

  return (
    <section className="relative flex h-full max-w-full flex-col pb-12">
      <ScrollArea className="scrollbar-hide h-full grow border border-none pb-2" scrollFade scrollbarHidden>
        {SOCIAL_PLATFORM_OPTIONS.map((option) => (
          <SocialPlatformRow
            key={option.platform}
            option={option}
            pendingDelete={deletePlatformSet.has(option.platform)}
            disabled={isSaving}
            initialIdentifier={initialIdentifierByPlatform.get(option.platform) ?? ""}
            onCommit={handleCommit}
            onUncommit={handleUncommit}
            onDraftChange={handleDraftChange}
          />
        ))}
      </ScrollArea>
      <footer className="fixed bottom-3 left-0 w-full px-4">
        <Button
          type="button"
          size="lg"
          disabled={isSaving || !hasPendingChanges}
          onClick={() => {
            void handleSaveSelectedPlatforms();
          }}
          className="w-full rounded-full py-6 font-semibold text-lg"
        >
          {isSaving ? "Saving..." : "Connect"}
        </Button>
      </footer>
    </section>
  );
}
