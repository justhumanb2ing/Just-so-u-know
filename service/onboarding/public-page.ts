import { sql } from "kysely";
import { cache } from "react";
import { kysely } from "@/lib/kysely";

const PUBLIC_HANDLE_PATTERN = /^@[a-z0-9]{3,20}$/;

export type PublicPageRow = {
  id: string;
  name: string | null;
  handle: string;
  bio: string | null;
  image: string | null;
  isPublic: boolean;
  userId: string;
};

export type PrimaryPageHandleRow = {
  handle: string;
};

export type PublicSitemapPageRow = {
  handle: string;
  updatedAt: string | Date;
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
      id,
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

const queryPrimaryPageHandleByUserId = cache(async (userId: string) => {
  const result = await sql<PrimaryPageHandleRow>`
    select
      handle
    from public.page
    where user_id = ${userId}
      and is_primary = true
    limit 1
  `.execute(kysely);

  return result.rows[0] ?? null;
});

const queryPublicSitemapPages = cache(async () => {
  const result = await sql<PublicSitemapPageRow>`
    select
      handle,
      updated_at as "updatedAt"
    from public.page
    where is_public = true
    order by updated_at desc
  `.execute(kysely);

  return result.rows;
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

/**
 * 로그인 사용자의 primary 페이지 handle만 조회한다.
 * `/me` 리다이렉트 계산 전용으로 최소 필드만 반환한다.
 */
export async function findPrimaryPageHandleByUserId(userId: string) {
  return queryPrimaryPageHandleByUserId(userId);
}

/**
 * sitemap 생성 시 색인 가능한 공개 페이지 handle 목록을 조회한다.
 */
export async function findPublicSitemapPages() {
  return queryPublicSitemapPages();
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

export type UpdateOwnedPageHandleInput = {
  storedHandle: string;
  nextStoredHandle: string;
  userId: string;
};

export type UpdateOwnedPageHandleResult = {
  handle: string;
  updatedAt: string;
};

/**
 * 소유한 페이지의 handle을 갱신한다.
 */
export async function updateOwnedPageHandle({
  storedHandle,
  nextStoredHandle,
  userId,
}: UpdateOwnedPageHandleInput): Promise<UpdateOwnedPageHandleResult | null> {
  const result = await sql<UpdateOwnedPageHandleResult>`
    update public.page
    set
      handle = ${nextStoredHandle}
    where handle = ${storedHandle}
      and user_id = ${userId}
    returning
      handle,
      updated_at as "updatedAt"
  `.execute(kysely);

  return result.rows[0] ?? null;
}

export type ToggleOwnedPageVisibilityInput = {
  storedHandle: string;
  userId: string;
};

export type ToggleOwnedPageVisibilityResult = {
  isPublic: boolean;
  updatedAt: string;
};

/**
 * 소유한 페이지의 공개 상태(is_public)를 원자적으로 토글한다.
 */
export async function toggleOwnedPageVisibility({
  storedHandle,
  userId,
}: ToggleOwnedPageVisibilityInput): Promise<ToggleOwnedPageVisibilityResult | null> {
  const result = await sql<ToggleOwnedPageVisibilityResult>`
    update public.page
    set
      is_public = not is_public
    where handle = ${storedHandle}
      and user_id = ${userId}
    returning
      is_public as "isPublic",
      updated_at as "updatedAt"
  `.execute(kysely);

  return result.rows[0] ?? null;
}

export type OwnedPageImageRow = {
  id: string;
  image: string | null;
};

export type FindOwnedPageImageInput = {
  storedHandle: string;
  userId: string;
};

/**
 * 이미지 작업용으로 소유 페이지의 최소 필드(id, image)만 조회한다.
 */
export async function findOwnedPageImage({ storedHandle, userId }: FindOwnedPageImageInput): Promise<OwnedPageImageRow | null> {
  const result = await sql<OwnedPageImageRow>`
    select
      id,
      image
    from public.page
    where handle = ${storedHandle}
      and user_id = ${userId}
    limit 1
  `.execute(kysely);

  return result.rows[0] ?? null;
}

export type UpdateOwnedPageImageInput = {
  storedHandle: string;
  userId: string;
  image: string | null;
};

export type UpdateOwnedPageImageResult = {
  image: string | null;
  updatedAt: string;
};

/**
 * 소유한 페이지의 image URL을 갱신한다.
 */
export async function updateOwnedPageImage({
  storedHandle,
  userId,
  image,
}: UpdateOwnedPageImageInput): Promise<UpdateOwnedPageImageResult | null> {
  const result = await sql<UpdateOwnedPageImageResult>`
    update public.page
    set
      image = ${image}
    where handle = ${storedHandle}
      and user_id = ${userId}
    returning
      image,
      updated_at as "updatedAt"
  `.execute(kysely);

  return result.rows[0] ?? null;
}
