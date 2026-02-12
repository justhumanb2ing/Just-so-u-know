"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { normalizeSocialIdentifier, type SocialPlatform } from "@/constants/social-platforms";
import { useTrackPageDbWrite } from "@/hooks/use-page-save-status";

export type SelectedSocialPlatformItem = {
  platform: SocialPlatform;
  username: string;
};

type UpsertPageSocialItemsSuccessResponse = {
  status: "success";
  items: Array<{
    id: string;
    platform: string;
    username: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  deletedPlatforms: SocialPlatform[];
};

type ErrorApiResponse = {
  status: "error";
  message: string;
};

type UpsertPageSocialItemsApiResponse = UpsertPageSocialItemsSuccessResponse | ErrorApiResponse;

/**
 * 소셜 계정 저장용 API 엔드포인트를 생성한다.
 */
export function buildPageSocialItemsEndpoint(handle: string) {
  return `/api/pages/${encodeURIComponent(handle)}/social-items`;
}

/**
 * API 응답 텍스트를 안전하게 JSON으로 파싱한다.
 * 빈 문자열 또는 비JSON 문자열은 null을 반환한다.
 */
export function parseUpsertPageSocialItemsApiResponse(responseText: string): UpsertPageSocialItemsApiResponse | null {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as UpsertPageSocialItemsApiResponse;
  } catch {
    return null;
  }
}

/**
 * 선택된 소셜 계정 목록을 플랫폼 기준으로 병합하고 빈 식별자를 제외한다.
 */
export function normalizeSelectedSocialItems(items: SelectedSocialPlatformItem[]) {
  const dedupedItemsByPlatform = new Map<SocialPlatform, string>();

  for (const item of items) {
    const normalizedUsername = normalizeSocialIdentifier(item.platform, item.username);

    if (!normalizedUsername) {
      continue;
    }

    dedupedItemsByPlatform.set(item.platform, normalizedUsername);
  }

  return Array.from(dedupedItemsByPlatform, ([platform, username]) => ({
    platform,
    username,
  }));
}

/**
 * 삭제 대상 플랫폼 목록을 중복 없이 정규화한다.
 */
export function normalizeDeletedSocialPlatforms(platforms: SocialPlatform[]) {
  return Array.from(new Set(platforms));
}

type UsePageSocialAccountsParams = {
  handle: string;
};

type UsePageSocialAccountsResult = {
  isSaving: boolean;
  saveSocialPlatformChanges: (payload: { upserts: SelectedSocialPlatformItem[]; deletes: SocialPlatform[] }) => Promise<boolean>;
};

/**
 * 선택된 소셜 계정을 배치 저장하고 전역 페이지 저장 상태와 연동한다.
 */
export function usePageSocialAccounts({ handle }: UsePageSocialAccountsParams): UsePageSocialAccountsResult {
  const trackPageDbWrite = useTrackPageDbWrite();
  const [isSaving, setIsSaving] = useState(false);

  const saveSocialPlatformChanges = useCallback(
    async (payload: { upserts: SelectedSocialPlatformItem[]; deletes: SocialPlatform[] }) => {
      const normalizedUpserts = normalizeSelectedSocialItems(payload.upserts);
      const upsertPlatformSet = new Set(normalizedUpserts.map((item) => item.platform));
      const normalizedDeletes = normalizeDeletedSocialPlatforms(payload.deletes).filter((platform) => !upsertPlatformSet.has(platform));

      if (normalizedUpserts.length === 0 && normalizedDeletes.length === 0) {
        return true;
      }

      setIsSaving(true);

      try {
        const response = await trackPageDbWrite(async () =>
          fetch(buildPageSocialItemsEndpoint(handle), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              upserts: normalizedUpserts,
              deletes: normalizedDeletes,
            }),
          }),
        );

        const responseText = await response.text();
        const payload = parseUpsertPageSocialItemsApiResponse(responseText);

        if (!response.ok || !payload || payload.status !== "success") {
          const message =
            payload?.status === "error" && payload.message ? payload.message : `Failed to save social platforms. (${response.status})`;
          throw new Error(message);
        }

        return true;
      } catch (error) {
        toast.error("Failed to save social platforms", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [handle, trackPageDbWrite],
  );

  return {
    isSaving,
    saveSocialPlatformChanges,
  };
}
