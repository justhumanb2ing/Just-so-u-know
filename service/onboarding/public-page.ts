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

export type PrivatePageAccessPolicyInput = {
  isPublic: boolean;
  isOwner: boolean;
};

export type PageEditPolicyInput = {
  isOwner: boolean;
};

/**
 * 경로 파라미터 handle을 공개 페이지 조회용 저장 포맷으로 정규화한다.
 */
export function normalizeStoredHandleFromPath(pathHandle: string) {
  const normalizedHandle = decodeURIComponent(pathHandle).toLowerCase();
  return PUBLIC_HANDLE_PATTERN.test(normalizedHandle) ? normalizedHandle : null;
}

const queryPageByStoredHandle = cache(async (storedHandle: string) => {
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
 * 비공개 페이지는 소유자에게만 접근을 허용한다.
 */
export function shouldDenyPrivatePageAccess({ isPublic, isOwner }: PrivatePageAccessPolicyInput) {
  return !isPublic && !isOwner;
}

/**
 * 페이지 프로필 편집은 소유자에게만 허용한다.
 */
export function canEditPageProfile({ isOwner }: PageEditPolicyInput) {
  return isOwner;
}

/**
 * 경로 handle로 페이지를 조회한다. 공개/비공개 여부와 관계없이 반환한다.
 */
export async function findPageByPathHandle(pathHandle: string) {
  const storedHandle = normalizeStoredHandleFromPath(pathHandle);

  if (!storedHandle) {
    return null;
  }

  return queryPageByStoredHandle(storedHandle);
}

/**
 * 공개 페이지 접근 가능 여부까지 반영해 페이지 데이터를 반환한다.
 */
export async function findPublicPageByPathHandle(pathHandle: string) {
  const page = await findPageByPathHandle(pathHandle);

  if (!page || !page.isPublic) {
    return null;
  }

  return page;
}

export type UpdateOwnedPageProfileInput = {
  storedHandle: string;
  userId: string;
  name: string | null;
  bio: string | null;
};

export type UpdateOwnedPageProfileResult = {
  name: string | null;
  bio: string | null;
  updatedAt: string;
};

/**
 * 소유한 페이지의 name/bio를 갱신한다.
 */
export async function updateOwnedPageProfile({
  storedHandle,
  userId,
  name,
  bio,
}: UpdateOwnedPageProfileInput): Promise<UpdateOwnedPageProfileResult | null> {
  const result = await sql<UpdateOwnedPageProfileResult>`
    update public.page
    set
      name = ${name},
      bio = ${bio}
    where handle = ${storedHandle}
      and user_id = ${userId}
    returning
      name,
      bio,
      updated_at as "updatedAt"
  `.execute(kysely);

  return result.rows[0] ?? null;
}
