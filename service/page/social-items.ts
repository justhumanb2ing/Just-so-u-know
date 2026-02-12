import { sql } from "kysely";
import { cache } from "react";
import type { SocialPlatform } from "@/constants/social-platforms";
import { kysely } from "@/lib/kysely";
import { normalizeStoredHandleFromPath } from "@/service/page/schema";

export type VisiblePageSocialItem = {
  id: string;
  platform: string;
  username: string;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type VisiblePageSocialItemRow = {
  id: string;
  platform: string;
  username: string;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type UpsertOwnedPageSocialItemInput = {
  platform: SocialPlatform;
  username: string;
};

export type UpsertOwnedPageSocialItemsInput = {
  storedHandle: string;
  userId: string;
  items: UpsertOwnedPageSocialItemInput[];
};

export type HideOwnedPageSocialItemsInput = {
  storedHandle: string;
  userId: string;
  platforms: SocialPlatform[];
};

/**
 * 동일 sortOrder가 존재할 때도 결과 순서가 안정적으로 유지되도록 보조 정렬 키를 적용한다.
 */
export function sortVisiblePageSocialItems(items: VisiblePageSocialItem[]) {
  const toTimeValue = (value: string | Date) => {
    if (value instanceof Date) {
      return value.getTime();
    }

    const parsedTime = Date.parse(value);
    return Number.isNaN(parsedTime) ? 0 : parsedTime;
  };

  return [...items].sort((first, second) => {
    if (first.sortOrder !== second.sortOrder) {
      return first.sortOrder - second.sortOrder;
    }

    const firstCreatedAtTime = toTimeValue(first.createdAt);
    const secondCreatedAtTime = toTimeValue(second.createdAt);

    if (firstCreatedAtTime !== secondCreatedAtTime) {
      return firstCreatedAtTime - secondCreatedAtTime;
    }

    return first.id.localeCompare(second.id);
  });
}

const queryVisiblePageSocialItemsByStoredHandle = cache(async (storedHandle: string): Promise<VisiblePageSocialItem[]> => {
  const result = await sql<VisiblePageSocialItemRow>`
    select
      page_social_items.id,
      page_social_items.platform,
      page_social_items.username,
      page_social_items.sort_order as "sortOrder",
      page_social_items.created_at as "createdAt",
      page_social_items.updated_at as "updatedAt"
    from public.page_social_items
    inner join public.page
      on public.page.id = page_social_items.page_id
    where public.page.handle = ${storedHandle}
      and page_social_items.is_visible = true
    order by page_social_items.sort_order asc, page_social_items.created_at asc, page_social_items.id asc
  `.execute(kysely);

  return sortVisiblePageSocialItems(result.rows);
});

/**
 * 저장 포맷 handle(@handle) 기준으로 노출 가능한 소셜 계정 목록을 조회한다.
 */
export async function findVisiblePageSocialItemsByStoredHandle(storedHandle: string) {
  return queryVisiblePageSocialItemsByStoredHandle(storedHandle);
}

/**
 * 경로 handle을 정규화한 뒤 노출 가능한 소셜 계정 목록을 조회한다.
 */
export async function findVisiblePageSocialItemsByPathHandle(pathHandle: string) {
  const storedHandle = normalizeStoredHandleFromPath(pathHandle);

  if (!storedHandle) {
    return [];
  }

  return queryVisiblePageSocialItemsByStoredHandle(storedHandle);
}

/**
 * 소유한 페이지의 소셜 계정을 플랫폼 기준으로 일괄 upsert한다.
 * 빈 식별자는 제외되며, 동일 플랫폼은 마지막 입력으로 병합된다.
 */
export async function upsertOwnedPageSocialItems({
  storedHandle,
  userId,
  items,
}: UpsertOwnedPageSocialItemsInput): Promise<VisiblePageSocialItem[]> {
  if (items.length === 0) {
    return [];
  }

  const itemPayload = JSON.stringify(items);

  const result = await sql<VisiblePageSocialItemRow>`
    with owned_page as (
      select id
      from public.page
      where handle = ${storedHandle}
        and user_id = ${userId}
      limit 1
    ),
    payload as (
      select
        entry.platform,
        entry.username
      from jsonb_to_recordset(${itemPayload}::jsonb) as entry(platform text, username text)
      where char_length(btrim(entry.username)) > 0
    ),
    upserted as (
      insert into public.page_social_items (
        page_id,
        platform,
        username,
        is_visible
      )
      select
        owned_page.id,
        payload.platform,
        payload.username,
        true
      from owned_page
      inner join payload on true
      on conflict (page_id, platform)
      do update set
        username = excluded.username,
        is_visible = true,
        updated_at = timezone('utc', now())
      returning
        page_social_items.id,
        page_social_items.platform,
        page_social_items.username,
        page_social_items.sort_order as "sortOrder",
        page_social_items.created_at as "createdAt",
        page_social_items.updated_at as "updatedAt"
    )
    select
      upserted.id,
      upserted.platform,
      upserted.username,
      upserted."sortOrder",
      upserted."createdAt",
      upserted."updatedAt"
    from upserted
  `.execute(kysely);

  return sortVisiblePageSocialItems(result.rows);
}

type HiddenPageSocialPlatformRow = {
  platform: string;
};

/**
 * 소유한 페이지의 소셜 계정을 플랫폼 기준으로 비노출 상태로 변경한다.
 */
export async function hideOwnedPageSocialItems({
  storedHandle,
  userId,
  platforms,
}: HideOwnedPageSocialItemsInput): Promise<SocialPlatform[]> {
  if (platforms.length === 0) {
    return [];
  }

  const platformPayload = JSON.stringify(platforms);

  const result = await sql<HiddenPageSocialPlatformRow>`
    with owned_page as (
      select id
      from public.page
      where handle = ${storedHandle}
        and user_id = ${userId}
      limit 1
    ),
    payload as (
      select jsonb_array_elements_text(${platformPayload}::jsonb) as platform
    ),
    hidden as (
      update public.page_social_items
      set
        is_visible = false,
        updated_at = timezone('utc', now())
      from owned_page, payload
      where page_social_items.page_id = owned_page.id
        and page_social_items.platform = payload.platform
      returning page_social_items.platform
    )
    select hidden.platform
    from hidden
  `.execute(kysely);

  return result.rows.map((row) => row.platform as SocialPlatform);
}
