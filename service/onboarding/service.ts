import { sql } from "kysely";
import { kysely } from "@/lib/kysely";
import { type OnboardingSubmissionInput, onboardingHandleSchema, toStoredHandle } from "@/service/onboarding/schema";

const HANDLE_UNIQUE_CONSTRAINT_CANDIDATES = new Set(["page_handle_unique_idx", "page_handle_key"]);

type PostgresErrorLike = {
  code?: string;
  constraint?: string;
  message?: string;
};

export type HandleAvailabilityStatus = "available" | "taken" | "invalid" | "error";

export type HandleAvailabilityResult = {
  status: HandleAvailabilityStatus;
  message: string;
  normalizedHandle?: string;
};

export type OnboardingServiceErrorCode = "HANDLE_TAKEN" | "INVALID_INPUT" | "USER_NOT_FOUND" | "TABLE_NOT_READY" | "UNKNOWN";

export class OnboardingServiceError extends Error {
  constructor(
    public readonly code: OnboardingServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OnboardingServiceError";
  }
}

export type CompleteOnboardingResult = {
  publicPath: string;
  storedHandle: string;
  isPrimary: boolean;
};

function toPostgresErrorLike(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as PostgresErrorLike;
}

function mapOnboardingDbError(error: unknown): OnboardingServiceError {
  const postgresError = toPostgresErrorLike(error);
  const code = postgresError?.code;
  const constraint = postgresError?.constraint ?? "";
  const message = postgresError?.message ?? "Unknown database error.";

  if (code === "42P01") {
    return new OnboardingServiceError("TABLE_NOT_READY", "Page table is not ready.");
  }

  if (code === "23505" && HANDLE_UNIQUE_CONSTRAINT_CANDIDATES.has(constraint)) {
    return new OnboardingServiceError("HANDLE_TAKEN", "This handle is already taken.");
  }

  if (code === "23503") {
    return new OnboardingServiceError("USER_NOT_FOUND", "User not found.");
  }

  if (code === "23505") {
    return new OnboardingServiceError("HANDLE_TAKEN", "A duplicate value was detected.");
  }

  if (code === "23514" || code === "22P02" || code === "P0001") {
    return new OnboardingServiceError("INVALID_INPUT", message);
  }

  return new OnboardingServiceError("UNKNOWN", message);
}

/**
 * 입력된 handle의 사용 가능 여부를 조회한다.
 */
export async function checkHandleAvailability(rawHandle: string): Promise<HandleAvailabilityResult> {
  const parsedHandle = onboardingHandleSchema.safeParse(rawHandle);

  if (!parsedHandle.success) {
    return {
      status: "invalid",
      message: parsedHandle.error.issues[0]?.message ?? "Invalid handle.",
    };
  }

  const normalizedHandle = parsedHandle.data;
  const storedHandle = toStoredHandle(normalizedHandle);

  try {
    const result = await sql<{ exists: boolean }>`
      select exists(select 1 from public.page where handle = ${storedHandle}) as "exists"
    `.execute(kysely);
    const row = result.rows[0];

    if (row?.exists) {
      return {
        status: "taken",
        message: "This handle is already taken.",
        normalizedHandle,
      };
    }

    return {
      status: "available",
      message: "This handle is available.",
      normalizedHandle,
    };
  } catch (error) {
    const mappedError = mapOnboardingDbError(error);

    return {
      status: "error",
      message:
        mappedError.code === "TABLE_NOT_READY"
          ? "Page storage is not ready yet. Run database migration first."
          : "Failed to validate handle availability.",
    };
  }
}

/**
 * 온보딩 완료 시 페이지를 생성하고 사용자 메타데이터의 onboardingComplete를 true로 갱신한다.
 */
export async function completeOnboardingWithPageCreation(
  userId: string,
  payload: Pick<OnboardingSubmissionInput, "handle" | "name" | "bio" | "image">,
): Promise<CompleteOnboardingResult> {
  const storedHandle = toStoredHandle(payload.handle);

  try {
    return await kysely.transaction().execute(async (trx) => {
      const createdPageResult = await sql<{ handle: string; isPrimary: boolean }>`
        select
          handle,
          is_primary as "isPrimary"
        from public.create_page_for_user(
          ${userId},
          ${storedHandle},
          ${payload.name ?? null},
          ${payload.bio ?? null},
          ${payload.image ?? null},
          true
        )
      `.execute(trx);
      const createdPage = createdPageResult.rows[0];

      if (!createdPage) {
        throw new OnboardingServiceError("UNKNOWN", "Failed to create page.");
      }

      const updatedUserResult = await sql<{ id: string }>`
        update public."user"
        set
          "userMetadata" = jsonb_set(
            coalesce("userMetadata", '{}'::jsonb),
            '{onboardingComplete}',
            'true'::jsonb,
            true
          ),
          "updatedAt" = now()
        where id = ${userId}
        returning id
      `.execute(trx);
      const updatedUser = updatedUserResult.rows[0];

      if (!updatedUser) {
        throw new OnboardingServiceError("USER_NOT_FOUND", "User not found.");
      }

      return {
        publicPath: `/${createdPage.handle}`,
        storedHandle: createdPage.handle,
        isPrimary: createdPage.isPrimary,
      };
    });
  } catch (error) {
    if (error instanceof OnboardingServiceError) {
      throw error;
    }

    throw mapOnboardingDbError(error);
  }
}
