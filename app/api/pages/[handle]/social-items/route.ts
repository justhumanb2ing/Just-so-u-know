import { headers } from "next/headers";
import { z } from "zod";
import { normalizeSocialIdentifier, SOCIAL_PLATFORM_DEFINITIONS, type SocialPlatform } from "@/constants/social-platforms";
import { auth } from "@/lib/auth/auth";
import { findPageByPathHandle } from "@/service/onboarding/public-page";
import { hideOwnedPageSocialItems, upsertOwnedPageSocialItems } from "@/service/page/social-items";

export const runtime = "nodejs";

type UpsertSocialItemsRouteContext = {
  params: Promise<{ handle: string }>;
};

type PostgresErrorLike = {
  code?: string;
  constraint?: string;
  message?: string;
};

const SOCIAL_PLATFORM_CODES = SOCIAL_PLATFORM_DEFINITIONS.map((platform) => platform.platform) as [SocialPlatform, ...SocialPlatform[]];

const socialPlatformSchema = z.enum(SOCIAL_PLATFORM_CODES, {
  message: "Invalid social platform.",
});

const pageSocialItemRouteSchema = z
  .object({
    platform: socialPlatformSchema,
    username: z.string(),
  })
  .transform((value) => ({
    platform: value.platform,
    username: normalizeSocialIdentifier(value.platform, value.username),
  }));

const pageSocialDeletePlatformRouteSchema = z
  .union([
    socialPlatformSchema,
    z.object({
      platform: socialPlatformSchema,
    }),
  ])
  .transform((value) => (typeof value === "string" ? value : value.platform));

const pageSocialItemsUpsertRouteSchema = z
  .object({
    upserts: z.array(pageSocialItemRouteSchema).max(SOCIAL_PLATFORM_DEFINITIONS.length, {
      message: "Too many social platform items.",
    }),
    deletes: z.array(pageSocialDeletePlatformRouteSchema).max(SOCIAL_PLATFORM_DEFINITIONS.length, {
      message: "Too many social platform items.",
    }),
  })
  .transform((value) => {
    const dedupedUpsertsByPlatform = new Map<SocialPlatform, string>();
    const dedupedDeletePlatformSet = new Set<SocialPlatform>();

    for (const item of value.upserts) {
      if (item.username.length === 0) {
        continue;
      }

      dedupedUpsertsByPlatform.set(item.platform, item.username);
    }

    for (const platform of value.deletes) {
      dedupedDeletePlatformSet.add(platform);
    }

    for (const upsertPlatform of dedupedUpsertsByPlatform.keys()) {
      dedupedDeletePlatformSet.delete(upsertPlatform);
    }

    return {
      upserts: Array.from(dedupedUpsertsByPlatform, ([platform, username]) => ({
        platform,
        username,
      })),
      deletes: Array.from(dedupedDeletePlatformSet),
    };
  });

function toPostgresErrorLike(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as PostgresErrorLike;
}

/**
 * 소셜 계정 저장 중 발생한 DB 예외를 HTTP 상태 코드/메시지로 정규화한다.
 */
function mapUpsertSocialItemsError(error: unknown) {
  const postgresError = toPostgresErrorLike(error);
  const code = postgresError?.code;
  const constraint = postgresError?.constraint;

  if (constraint === "page_social_items_platform_format_check") {
    return {
      status: 422,
      message: "Invalid social platform format.",
    };
  }

  if (code === "22P02" || code === "23502" || code === "23514") {
    return {
      status: 422,
      message: "Invalid social platform payload.",
    };
  }

  return {
    status: 500,
    message: "Failed to save social platforms.",
  };
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
    console.error("[pages/social-items] Failed to get session.", error);
    return null;
  }
}

/**
 * 소유한 페이지의 선택된 소셜 계정을 일괄 저장한다.
 */
export async function POST(request: Request, context: UpsertSocialItemsRouteContext) {
  const requestHeaders = await headers();
  const session = await resolveSessionOrNull(requestHeaders);

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
  const page = await findPageByPathHandle(handle);

  if (!page) {
    return Response.json(
      {
        status: "error",
        message: "Page not found.",
      },
      { status: 404 },
    );
  }

  if (page.userId !== session.user.id) {
    return Response.json(
      {
        status: "error",
        message: "You do not have permission to update this page.",
      },
      { status: 403 },
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

  const parsedBody = pageSocialItemsUpsertRouteSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return Response.json(
      {
        status: "error",
        message: parsedBody.error.issues[0]?.message ?? "Invalid request payload.",
      },
      { status: 422 },
    );
  }

  if (parsedBody.data.upserts.length === 0 && parsedBody.data.deletes.length === 0) {
    return Response.json({
      status: "success",
      items: [],
      deletedPlatforms: [],
    });
  }

  try {
    const [items, deletedPlatforms] = await Promise.all([
      upsertOwnedPageSocialItems({
        storedHandle: page.handle,
        userId: session.user.id,
        items: parsedBody.data.upserts,
      }),
      hideOwnedPageSocialItems({
        storedHandle: page.handle,
        userId: session.user.id,
        platforms: parsedBody.data.deletes,
      }),
    ]);

    return Response.json({
      status: "success",
      items,
      deletedPlatforms,
    });
  } catch (error) {
    console.error("[pages/social-items] Failed to save social platform changes.", error);
    const mappedError = mapUpsertSocialItemsError(error);

    return Response.json(
      {
        status: "error",
        message: mappedError.message,
      },
      { status: mappedError.status },
    );
  }
}
