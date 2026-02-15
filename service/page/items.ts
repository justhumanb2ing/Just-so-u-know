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

export type CreateOwnedLinkItemInput = {
  storedHandle: string;
  userId: string;
  url: string;
  title: string;
  favicon: string | null;
};

export type CreateOwnedMapItemInput = {
  storedHandle: string;
  userId: string;
  lat: number;
  lng: number;
  zoom: number;
  caption: string;
  googleMapUrl: string;
};

export type UpdateOwnedMemoItemInput = {
  storedHandle: string;
  userId: string;
  itemId: string;
  content: string;
};

export type UpdateOwnedLinkItemTitleInput = {
  storedHandle: string;
  userId: string;
  itemId: string;
  title: string;
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

export type ReorderVisiblePageItemsInput = {
  pageId: string;
  itemIds: string[];
};

const PAGE_ITEM_ORDER_KEY_MAX = 2147483647;
const DEFAULT_MAP_ITEM_SIZE_CODE = "wide-full";

/**
 * map 아이템 생성 시 적용할 기본 size_code를 반환한다.
 */
export function resolveDefaultMapItemSizeCode() {
  return DEFAULT_MAP_ITEM_SIZE_CODE;
}

/**
 * 임시 재정렬 구간 오프셋을 계산한다.
 * 페이지 내 기존 최대 order_key를 기준으로 이동 대상을 안전 구간(max+1..max+N)으로 먼저 옮긴다.
 */
export function resolveReorderTemporaryOffset(maxOrderKey: number | null, movingItemCount: number): number | null {
  const safeMaxOrderKey = typeof maxOrderKey === "number" && Number.isFinite(maxOrderKey) ? maxOrderKey : 0;

  if (safeMaxOrderKey > PAGE_ITEM_ORDER_KEY_MAX - movingItemCount) {
    return null;
  }

  return safeMaxOrderKey;
}

/**
 * 전달받은 item id 배열을 정렬 순서 CTE로 변환한다.
 * 배열 순서를 보존하기 위해 `unnest(... with ordinality)`를 사용한다.
 */
export function buildReorderRequestOrderCte(itemIds: string[]) {
  return sql`
    select
      request.item_id,
      request.ordinality::integer as next_order_key
    from unnest(${itemIds}::uuid[]) with ordinality as request(item_id, ordinality)
  `;
}

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
 * 소유한 페이지에 link 아이템 1개를 생성한다.
 * 정렬 키 생성/동시성 제어/정합성 검증은 DB 함수에서 처리한다.
 */
export async function createOwnedLinkItem({ storedHandle, userId, url, title, favicon }: CreateOwnedLinkItemInput): Promise<PageItemRow> {
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
    from public.create_link_item_for_owned_page(
      ${userId},
      ${storedHandle},
      ${url},
      ${title},
      ${favicon}
    )
  `.execute(kysely);

  const createdItem = result.rows[0];

  if (!createdItem) {
    throw new Error("Failed to create link item.");
  }

  return createdItem;
}

function createPageItemDomainError(message: string) {
  const error = new Error(message) as Error & { code: string };
  error.code = "P0001";
  return error;
}

/**
 * 소유한 페이지에 map 아이템 1개를 생성한다.
 * 페이지 단위 advisory lock으로 순서 키 충돌을 방지하고 위치 메타데이터를 함께 저장한다.
 */
export async function createOwnedMapItem({
  storedHandle,
  userId,
  lat,
  lng,
  zoom,
  caption,
  googleMapUrl,
}: CreateOwnedMapItemInput): Promise<PageItemRow> {
  const result = await sql<PageItemRow>`
    with owned_page as (
      select public.page.id
      from public.page
      where public.page.handle = ${storedHandle}
        and public.page.user_id = ${userId}
      limit 1
    ),
    page_lock as (
      select pg_advisory_xact_lock(hashtext(owned_page.id::text))
      from owned_page
    ),
    next_order as (
      select
        owned_page.id as page_id,
        coalesce(max(public.page_item.order_key), 0) + 1 as next_order_key
      from owned_page
      inner join page_lock on true
      left join public.page_item
        on public.page_item.page_id = owned_page.id
      group by owned_page.id
    ),
    inserted as (
      insert into public.page_item (
        page_id,
        type_code,
        size_code,
        order_key,
        data
      )
      select
        next_order.page_id,
        'map',
        ${resolveDefaultMapItemSizeCode()}::text,
        next_order.next_order_key,
        jsonb_strip_nulls(
          jsonb_build_object(
            'lat', ${lat}::double precision,
            'lng', ${lng}::double precision,
            'zoom', ${zoom}::double precision,
            'caption', ${caption}::text,
            'googleMapUrl', ${googleMapUrl}::text
          )
        )
      from next_order
      where next_order.next_order_key <= ${PAGE_ITEM_ORDER_KEY_MAX}
      returning
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
    )
    select
      inserted.id,
      inserted."pageId",
      inserted."typeCode",
      inserted."sizeCode",
      inserted."orderKey",
      inserted.data,
      inserted."isVisible",
      inserted."lockVersion",
      inserted."createdAt",
      inserted."updatedAt"
    from inserted
  `.execute(kysely);

  const createdItem = result.rows[0];

  if (createdItem) {
    return createdItem;
  }

  const ownershipResult = await sql<{ isOwner: boolean }>`
    select exists(
      select 1
      from public.page
      where public.page.handle = ${storedHandle}
        and public.page.user_id = ${userId}
    ) as "isOwner"
  `.execute(kysely);

  if (!ownershipResult.rows[0]?.isOwner) {
    throw createPageItemDomainError("page not found or permission denied");
  }

  throw createPageItemDomainError("order key overflow");
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
 * 소유한 페이지의 link 아이템 title을 수정한다.
 * 페이지 소유권과 아이템 타입(link) 조건을 동시에 만족해야 갱신된다.
 */
export async function updateOwnedLinkItemTitle({
  storedHandle,
  userId,
  itemId,
  title,
}: UpdateOwnedLinkItemTitleInput): Promise<PageItemRow | null> {
  const result = await sql<PageItemRow>`
    update public.page_item
    set
      data = jsonb_set(page_item.data, '{title}', to_jsonb(${title}::text), true),
      lock_version = page_item.lock_version + 1
    from public.page
    where public.page.id = page_item.page_id
      and public.page.handle = ${storedHandle}
      and public.page.user_id = ${userId}
      and page_item.id = ${itemId}::uuid
      and page_item.type_code = 'link'
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

/**
 * 가시 아이템의 순서를 전체 item id 배열 기준으로 1..N으로 재번호화한다.
 * 입력 배열이 현재 페이지 아이템 집합과 정확히 일치하지 않으면 갱신하지 않는다.
 */
export async function reorderVisiblePageItems({ pageId, itemIds }: ReorderVisiblePageItemsInput): Promise<boolean> {
  if (itemIds.length === 0) {
    return false;
  }

  return kysely.transaction().execute(async (transaction) => {
    const visibleItemRows = await sql<{ id: string }>`
      select
        id
      from public.page_item
      where page_id = ${pageId}::uuid
        and is_visible = true
      order by order_key asc
    `.execute(transaction);

    if (visibleItemRows.rows.length !== itemIds.length) {
      return false;
    }

    const visibleItemIdSet = new Set(visibleItemRows.rows.map((row) => row.id));
    const requestItemIdSet = new Set(itemIds);

    if (requestItemIdSet.size !== itemIds.length) {
      return false;
    }

    for (const itemId of itemIds) {
      if (!visibleItemIdSet.has(itemId)) {
        return false;
      }
    }

    const maxOrderKeyResult = await sql<{ maxOrderKey: number | null }>`
      select
        max(order_key) as "maxOrderKey"
      from public.page_item
      where page_id = ${pageId}::uuid
    `.execute(transaction);

    const temporaryOffset = resolveReorderTemporaryOffset(maxOrderKeyResult.rows[0]?.maxOrderKey ?? null, itemIds.length);

    if (temporaryOffset === null) {
      return false;
    }

    const requestOrderCte = buildReorderRequestOrderCte(itemIds);

    await sql`
      with next_order as (
        ${requestOrderCte}
      )
      update public.page_item
      set order_key = next_order.next_order_key + ${temporaryOffset}
      from next_order
      where public.page_item.page_id = ${pageId}::uuid
        and public.page_item.is_visible = true
        and public.page_item.id = next_order.item_id
    `.execute(transaction);

    const reorderedRows = await sql<{ id: string }>`
      with next_order as (
        ${requestOrderCte}
      )
      update public.page_item
      set
        order_key = next_order.next_order_key,
        lock_version = public.page_item.lock_version + 1
      from next_order
      where public.page_item.page_id = ${pageId}::uuid
        and public.page_item.is_visible = true
        and public.page_item.id = next_order.item_id
      returning
        public.page_item.id
    `.execute(transaction);

    return reorderedRows.rows.length === itemIds.length;
  });
}
