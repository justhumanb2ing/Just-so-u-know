import { sql } from "kysely";
import { cache } from "react";
import { kysely } from "@/lib/kysely";
import type { PageItemSizeCode } from "@/service/page/item-size";
import { normalizeStoredHandleFromPath } from "@/service/page/schema";

export type PageItemRow = {
  id: string;
  pageId: string;
  typeCode: string;
  sizeCode: string;
  orderKey: number;
  data: unknown;
  isVisible: boolean;
  lockVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type VisiblePageItem = {
  id: string;
  typeCode: string;
  sizeCode: string;
  orderKey: number;
  data: unknown;
  createdAt: string;
  updatedAt: string;
};

type VisiblePageItemRow = {
  id: string;
  typeCode: string;
  sizeCode: string;
  orderKey: number;
  data: unknown;
  createdAt: string;
  updatedAt: string;
};

export type CreateOwnedMemoItemInput = {
  storedHandle: string;
  userId: string;
  content: string;
};

export type UpdateOwnedMemoItemInput = {
  storedHandle: string;
  userId: string;
  itemId: string;
  content: string;
};

export type DeleteOwnedPageItemInput = {
  storedHandle: string;
  userId: string;
  itemId: string;
};

export type UpdateOwnedPageItemSizeInput = {
  storedHandle: string;
  userId: string;
  itemId: string;
  sizeCode: PageItemSizeCode;
};

const queryVisiblePageItemsByStoredHandle = cache(async (storedHandle: string): Promise<VisiblePageItem[]> => {
  const result = await sql<VisiblePageItemRow>`
    select
      page_item.id,
      page_item.type_code as "typeCode",
      page_item.size_code as "sizeCode",
      page_item.order_key as "orderKey",
      page_item.data,
      page_item.created_at as "createdAt",
      page_item.updated_at as "updatedAt"
    from public.page_item
    inner join public.page
      on public.page.id = page_item.page_id
    where public.page.handle = ${storedHandle}
      and page_item.is_visible = true
    order by page_item.order_key asc
  `.execute(kysely);

  return result.rows;
});

/**
 * 저장 포맷 handle(@handle) 기준으로 노출 가능한 전체 아이템 목록을 조회한다.
 */
export async function findVisiblePageItemsByStoredHandle(storedHandle: string) {
  return queryVisiblePageItemsByStoredHandle(storedHandle);
}

/**
 * 경로 handle을 정규화한 뒤 노출 가능한 전체 아이템 목록을 조회한다.
 */
export async function findVisiblePageItemsByPathHandle(pathHandle: string) {
  const storedHandle = normalizeStoredHandleFromPath(pathHandle);

  if (!storedHandle) {
    return [];
  }

  return queryVisiblePageItemsByStoredHandle(storedHandle);
}

/**
 * 소유한 페이지에 memo 아이템 1개를 생성한다.
 * 정렬 키 생성/동시성 제어/정합성 검증은 DB 함수에서 처리한다.
 */
export async function createOwnedMemoItem({ storedHandle, userId, content }: CreateOwnedMemoItemInput): Promise<PageItemRow> {
  const result = await sql<PageItemRow>`
    select
      id,
      page_id as "pageId",
      type_code as "typeCode",
      size_code as "sizeCode",
      order_key as "orderKey",
      data,
      is_visible as "isVisible",
      lock_version as "lockVersion",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from public.create_memo_item_for_owned_page(
      ${userId},
      ${storedHandle},
      ${content}
    )
  `.execute(kysely);

  const createdItem = result.rows[0];

  if (!createdItem) {
    throw new Error("Failed to create memo item.");
  }

  return createdItem;
}

/**
 * 소유한 페이지의 memo 아이템 content를 수정한다.
 * 페이지 소유권과 아이템 타입(memo) 조건을 동시에 만족해야 갱신된다.
 */
export async function updateOwnedMemoItem({
  storedHandle,
  userId,
  itemId,
  content,
}: UpdateOwnedMemoItemInput): Promise<PageItemRow | null> {
  const result = await sql<PageItemRow>`
    update public.page_item
    set
      data = jsonb_set(page_item.data, '{content}', to_jsonb(${content}::text), true),
      lock_version = page_item.lock_version + 1
    from public.page
    where public.page.id = page_item.page_id
      and public.page.handle = ${storedHandle}
      and public.page.user_id = ${userId}
      and page_item.id = ${itemId}::uuid
      and page_item.type_code = 'memo'
    returning
      page_item.id,
      page_item.page_id as "pageId",
      page_item.type_code as "typeCode",
      page_item.size_code as "sizeCode",
      page_item.order_key as "orderKey",
      page_item.data,
      page_item.is_visible as "isVisible",
      page_item.lock_version as "lockVersion",
      page_item.created_at as "createdAt",
      page_item.updated_at as "updatedAt"
  `.execute(kysely);

  return result.rows[0] ?? null;
}

/**
 * 소유한 페이지의 아이템 size_code를 수정한다.
 * 페이지 소유권 조건과 itemId를 동시에 만족해야 갱신된다.
 */
export async function updateOwnedPageItemSize({
  storedHandle,
  userId,
  itemId,
  sizeCode,
}: UpdateOwnedPageItemSizeInput): Promise<PageItemRow | null> {
  const result = await sql<PageItemRow>`
    update public.page_item
    set
      size_code = ${sizeCode},
      lock_version = page_item.lock_version + 1
    from public.page
    where public.page.id = page_item.page_id
      and public.page.handle = ${storedHandle}
      and public.page.user_id = ${userId}
      and page_item.id = ${itemId}::uuid
    returning
      page_item.id,
      page_item.page_id as "pageId",
      page_item.type_code as "typeCode",
      page_item.size_code as "sizeCode",
      page_item.order_key as "orderKey",
      page_item.data,
      page_item.is_visible as "isVisible",
      page_item.lock_version as "lockVersion",
      page_item.created_at as "createdAt",
      page_item.updated_at as "updatedAt"
  `.execute(kysely);

  return result.rows[0] ?? null;
}

/**
 * 소유한 페이지의 아이템 1개를 물리 삭제한다.
 * handle + userId 소유권 조건과 itemId를 동시에 만족해야 삭제된다.
 */
export async function deleteOwnedPageItem({ storedHandle, userId, itemId }: DeleteOwnedPageItemInput): Promise<PageItemRow | null> {
  const result = await sql<PageItemRow>`
    delete from public.page_item
    using public.page
    where public.page.id = page_item.page_id
      and public.page.handle = ${storedHandle}
      and public.page.user_id = ${userId}
      and page_item.id = ${itemId}::uuid
    returning
      page_item.id,
      page_item.page_id as "pageId",
      page_item.type_code as "typeCode",
      page_item.size_code as "sizeCode",
      page_item.order_key as "orderKey",
      page_item.data,
      page_item.is_visible as "isVisible",
      page_item.lock_version as "lockVersion",
      page_item.created_at as "createdAt",
      page_item.updated_at as "updatedAt"
  `.execute(kysely);

  return result.rows[0] ?? null;
}
