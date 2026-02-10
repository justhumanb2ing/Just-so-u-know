import { z } from "zod";
import { isReservedHandle } from "@/service/onboarding/reserved-handles";

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 20;
export const HANDLE_PATTERN = /^[a-z0-9]+$/;
const STORED_HANDLE_PATTERN = /^@[a-z0-9]{3,20}$/;
const LINE_BREAK_PATTERN = /[\r\n]+/g;

function emptyStringToNull(value: string | null | undefined) {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeSingleLineText(value: string | null | undefined) {
  if (value == null) {
    return null;
  }

  return value.replace(LINE_BREAK_PATTERN, " ");
}

function nullableTrimmedText(maxLength: number, message: string) {
  return z.preprocess(
    (value) => emptyStringToNull(typeof value === "string" ? value : null),
    z.string().max(maxLength, message).nullable(),
  );
}

function nullableText() {
  return z.preprocess((value) => emptyStringToNull(typeof value === "string" ? value : null), z.string().nullable());
}

/**
 * 온보딩 handle 입력값을 정규화(공백 제거 + 소문자화)하고 정책을 검증한다.
 */
export const onboardingHandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(HANDLE_MIN_LENGTH, `Handle must be at least ${HANDLE_MIN_LENGTH} characters.`)
  .max(HANDLE_MAX_LENGTH, `Handle must be at most ${HANDLE_MAX_LENGTH} characters.`)
  .regex(HANDLE_PATTERN, "Handle can only include lowercase letters and numbers.")
  .refine((value) => !isReservedHandle(value), {
    message: "This handle is reserved.",
  });

/**
 * DB 저장용 handle 값(@ 접두 포함)을 생성한다.
 */
export const onboardingStoredHandleSchema = onboardingHandleSchema.transform((value) => `@${value}`);

/**
 * 온보딩 제출 페이로드를 검증한다.
 */
export const onboardingSubmissionSchema = z.object({
  handle: onboardingHandleSchema,
  verifiedHandle: onboardingHandleSchema,
  name: nullableText().optional(),
  bio: nullableTrimmedText(200, "Bio must be at most 200 characters.").optional(),
  image: z
    .preprocess((value) => emptyStringToNull(typeof value === "string" ? value : null), z.url("Image must be a valid URL.").nullable())
    .optional(),
});

export type OnboardingSubmissionInput = z.infer<typeof onboardingSubmissionSchema>;

/**
 * 공개 페이지 편집 입력(name, bio)을 단일 라인으로 정규화하고 검증한다.
 */
export const pageProfileUpdateSchema = z.object({
  storedHandle: z.string().trim().toLowerCase().regex(STORED_HANDLE_PATTERN, "Invalid page handle."),
  name: z.preprocess(
    (value) => emptyStringToNull(normalizeSingleLineText(typeof value === "string" ? value : null)),
    z.string().nullable(),
  ),
  bio: z.preprocess(
    (value) => emptyStringToNull(normalizeSingleLineText(typeof value === "string" ? value : null)),
    z.string().max(200, "Bio must be at most 200 characters.").nullable(),
  ),
});

export type PageProfileUpdateInput = z.infer<typeof pageProfileUpdateSchema>;

/**
 * 사용자 입력 handle을 저장 포맷(@handle)으로 변환한다.
 */
export function toStoredHandle(handle: string) {
  return onboardingStoredHandleSchema.parse(handle);
}
