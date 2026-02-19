import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { findPageByPathHandle, shouldDenyPrivatePageAccess } from "@/service/onboarding/public-page";
import {
  createOwnedLinkItem,
  createOwnedMapItem,
  createOwnedMediaItem,
  createOwnedMemoItem,
  createOwnedSectionItem,
  findVisiblePageItemsByStoredHandle,
} from "@/service/page/items";
import { normalizeStoredHandleFromPath, pageItemCreateSchema } from "@/service/page/schema";

export const runtime = "nodejs";

type CreateItemRouteContext = {
  params: Promise<{ handle: string }>;
};

type PostgresErrorLike = {
  code?: string;
  message?: string;
  constraint?: string;
};

function toPostgresErrorLike(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as PostgresErrorLike;
}

/**
 * 요청 헤더로 세션 조회를 시도하고, 조회 실패 예외는 비로그인 상태로 처리한다.
 */
async function resolveSessionOrNull(requestHeaders: Headers) {
  try {
    return await auth.api.getSession({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("[pages/items] Failed to get session.", error);
    return null;
  }
}

/**
 * 공개/소유자 권한에 맞는 페이지 아이템 조회를 처리한다.
 */
export async function GET(_request: Request, context: CreateItemRouteContext) {
  const { handle } = await context.params;
  const requestHeaders = await headers();
  const [page, session] = await Promise.all([findPageByPathHandle(handle), resolveSessionOrNull(requestHeaders)]);

  if (!page) {
    return Response.json(
      {
        status: "error",
        message: "Page not found.",
      },
      { status: 404 },
    );
  }

  const isOwner = page.userId === session?.user.id;

  if (shouldDenyPrivatePageAccess({ isPublic: page.isPublic, isOwner })) {
    return Response.json(
      {
        status: "error",
        message: "You do not have permission to view this page.",
      },
      { status: 403 },
    );
  }

  const items = await findVisiblePageItemsByStoredHandle(page.handle);

  return Response.json({
    status: "success",
    items,
  });
}

/**
 * 페이지 아이템 생성 중 발생한 DB 예외를 HTTP 상태 코드/메시지로 정규화한다.
 */
function mapCreateItemError(error: unknown) {
  const postgresError = toPostgresErrorLike(error);
  const code = postgresError?.code;
  const message = postgresError?.message ?? "Failed to create item.";
  const constraint = postgresError?.constraint ?? "";

  if (code === "P0001") {
    if (message === "page not found or permission denied") {
      return {
        status: 403,
        message: "You do not have permission to update this page.",
      };
    }

    return {
      status: 422,
      message,
    };
  }

  if (code === "23503") {
    if (constraint === "page_item_size_code_fkey") {
      return {
        status: 422,
        message: "Invalid item size.",
      };
    }

    if (constraint === "page_item_type_code_fkey") {
      return {
        status: 422,
        message: "Invalid item type.",
      };
    }
  }

  if (code === "42501") {
    return {
      status: 500,
      message: "Database permission is not configured for map item creation.",
    };
  }

  if (code === "42P01" || code === "42703") {
    return {
      status: 500,
      message: "Database schema for map item creation is outdated.",
    };
  }

  return {
    status: 500,
    message: code ? `Failed to create item. (${code})` : "Failed to create item.",
  };
}

/**
 * 소유한 페이지에 새 아이템을 생성한다.
 * 현재는 memo/section/link/map/image/video 타입 생성을 지원한다.
 */
export async function POST(request: Request, context: CreateItemRouteContext) {
  const session = await resolveSessionOrNull(request.headers);

  if (!session) {
    return Response.json(
      {
        status: "error",
        message: "You need to sign in first.",
      },
      { status: 401 },
    );
  }

  const { handle } = await context.params;
  const storedHandle = normalizeStoredHandleFromPath(handle);

  if (!storedHandle) {
    return Response.json(
      {
        status: "error",
        message: "Page not found.",
      },
      { status: 404 },
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Invalid request payload.",
      },
      { status: 400 },
    );
  }

  const parsedBody = pageItemCreateSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return Response.json(
      {
        status: "error",
        message: parsedBody.error.issues[0]?.message ?? "Invalid request payload.",
      },
      { status: 422 },
    );
  }

  try {
    const createdItem =
      parsedBody.data.type === "memo"
        ? await createOwnedMemoItem({
            storedHandle,
            userId: session.user.id,
            content: parsedBody.data.data.content,
          })
        : parsedBody.data.type === "section"
          ? await createOwnedSectionItem({
              storedHandle,
              userId: session.user.id,
              content: parsedBody.data.data.content,
            })
          : parsedBody.data.type === "link"
            ? await createOwnedLinkItem({
                storedHandle,
                userId: session.user.id,
                url: parsedBody.data.data.url,
                title: parsedBody.data.data.title,
                favicon: parsedBody.data.data.favicon ?? null,
              })
            : parsedBody.data.type === "map"
              ? await createOwnedMapItem({
                  storedHandle,
                  userId: session.user.id,
                  lat: parsedBody.data.data.lat,
                  lng: parsedBody.data.data.lng,
                  zoom: parsedBody.data.data.zoom,
                  caption: parsedBody.data.data.caption,
                  googleMapUrl: parsedBody.data.data.googleMapUrl,
                })
              : await createOwnedMediaItem({
                  storedHandle,
                  userId: session.user.id,
                  typeCode: parsedBody.data.type,
                  src: parsedBody.data.data.src,
                  mimeType: parsedBody.data.data.mimeType,
                  fileName: parsedBody.data.data.fileName,
                  fileSize: parsedBody.data.data.fileSize,
                  objectKey: parsedBody.data.data.objectKey,
                });

    return Response.json(
      {
        status: "success",
        item: createdItem,
      },
      {
        status: 201,
        headers: {
          Location: `/api/pages/${encodeURIComponent(storedHandle)}/items/${createdItem.id}`,
        },
      },
    );
  } catch (error) {
    const mappedError = mapCreateItemError(error);

    return Response.json(
      {
        status: "error",
        message: mappedError.message,
      },
      { status: mappedError.status },
    );
  }
}
