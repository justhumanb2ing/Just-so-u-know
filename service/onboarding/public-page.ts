import { sql } from "kysely";
import { cache } from "react";
import { kysely } from "@/lib/kysely";

const PUBLIC_HANDLE_PATTERN = /^@[a-z0-9]{3,20}$/;

export type PublicPageRow = {
  name: string | null;
  handle: string;
  bio: string | null;
  image: string | null;
  isPublic: boolean;
  userId: string;
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
      name,
      handle,
      bio,
      image,
      is_public as "isPublic",
      user_id as "userId"
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

export type UpdateOwnedPublicPageProfileInput = {
  storedHandle: string;
  userId: string;
  name: string | null;
  bio: string | null;
};

export type UpdateOwnedPublicPageProfileResult = {
  name: string | null;
  bio: string | null;
  updatedAt: string;
};

/**
 * 소유한 공개 페이지의 name/bio를 갱신한다.
 */
export async function updateOwnedPublicPageProfile({
  storedHandle,
  userId,
  name,
  bio,
}: UpdateOwnedPublicPageProfileInput): Promise<UpdateOwnedPublicPageProfileResult | null> {
  const result = await sql<UpdateOwnedPublicPageProfileResult>`
    update public.page
    set
      name = ${name},
      bio = ${bio}
    where handle = ${storedHandle}
      and user_id = ${userId}
      and is_public = true
    returning
      name,
      bio,
      updated_at as "updatedAt"
  `.execute(kysely);

  return result.rows[0] ?? null;
}
