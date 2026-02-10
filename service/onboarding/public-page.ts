import { sql } from "kysely";
import { cache } from "react";
import { kysely } from "@/lib/kysely";

const PUBLIC_HANDLE_PATTERN = /^@[a-z0-9]{3,20}$/;

export type PublicPageRow = {
  title: string | null;
  handle: string;
  bio: string | null;
  image: string | null;
  isPublic: boolean;
};

/**
 * 경로 파라미터 handle을 공개 페이지 조회용 저장 포맷으로 정규화한다.
 */
export function normalizeStoredHandleFromPath(pathHandle: string) {
  const normalizedHandle = decodeURIComponent(pathHandle).toLowerCase();
  return PUBLIC_HANDLE_PATTERN.test(normalizedHandle) ? normalizedHandle : null;
}

const queryPublicPageByStoredHandle = cache(async (storedHandle: string) => {
  const result = await sql<PublicPageRow>`
    select
      title,
      handle,
      bio,
      image,
      is_public as "isPublic"
    from public.page
    where handle = ${storedHandle}
    limit 1
  `.execute(kysely);

  return result.rows[0] ?? null;
});

/**
 * 공개 페이지 접근 가능 여부까지 반영해 페이지 데이터를 반환한다.
 */
export async function findPublicPageByPathHandle(pathHandle: string) {
  const storedHandle = normalizeStoredHandleFromPath(pathHandle);

  if (!storedHandle) {
    return null;
  }

  const page = await queryPublicPageByStoredHandle(storedHandle);

  if (!page || !page.isPublic) {
    return null;
  }

  return page;
}
