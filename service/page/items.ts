import { sql } from "kysely";
import { kysely } from "@/lib/kysely";

export type PageItemRow = {
  id: string;
  pageId: string;
  typeCode: string;
  sizeCode: string;
  orderKey: string;
  data: unknown;
  isVisible: boolean;
  lockVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateOwnedMemoItemInput = {
  storedHandle: string;
  userId: string;
  content: string;
};

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
