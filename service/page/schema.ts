import { z } from "zod";

const STORED_HANDLE_PATTERN = /^@[a-z0-9]{3,20}$/;
const LINE_BREAK_PATTERN = /[\r\n]+/g;

/**
 * 경로 파라미터 handle을 DB 저장 포맷(@handle)으로 정규화한다.
 */
export function normalizeStoredHandleFromPath(pathHandle: string) {
  const normalizedHandle = decodeURIComponent(pathHandle).toLowerCase();
  return STORED_HANDLE_PATTERN.test(normalizedHandle) ? normalizedHandle : null;
}

/**
 * memo 아이템 생성 입력의 content를 단일 라인으로 정규화한다.
 */
const memoContentSchema = z
  .string()
  .transform((value) => value.replace(LINE_BREAK_PATTERN, " ").trim())
  .refine((value) => value.length > 0, {
    message: "Memo content is required.",
  });

/**
 * 페이지 아이템 생성 API 입력을 검증한다.
 * 현재는 memo 타입만 허용한다.
 */
export const pageItemCreateSchema = z.object({
  type: z.literal("memo"),
  data: z.object({
    content: memoContentSchema,
  }),
});

export type PageItemCreateInput = z.infer<typeof pageItemCreateSchema>;
