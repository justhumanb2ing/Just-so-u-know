import { sql } from "kysely";
import { cache } from "react";
import { kysely } from "@/lib/kysely";
import { normalizeStoredHandleFromPath } from "@/service/page/schema";

export type VisiblePageSocialItem = {
  id: string;
  platform: string;
  username: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type VisiblePageSocialItemRow = {
  id: string;
  platform: string;
  username: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * 동일 sortOrder가 존재할 때도 결과 순서가 안정적으로 유지되도록 보조 정렬 키를 적용한다.
 */
export function sortVisiblePageSocialItems(items: VisiblePageSocialItem[]) {
  return [...items].sort((first, second) => {
    if (first.sortOrder !== second.sortOrder) {
      return first.sortOrder - second.sortOrder;
    }

    if (first.createdAt !== second.createdAt) {
      return first.createdAt.localeCompare(second.createdAt);
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
