import { z } from "zod";
import { PAGE_ITEM_SIZE_CODES } from "@/service/page/item-size";

const STORED_HANDLE_PATTERN = /^@[a-z0-9]{3,20}$/;
const WINDOWS_LINE_BREAK_PATTERN = /\r\n?/g;

/**
 * 경로 파라미터 handle을 DB 저장 포맷(@handle)으로 정규화한다.
 */
export function normalizeStoredHandleFromPath(pathHandle: string) {
  const normalizedHandle = decodeURIComponent(pathHandle).toLowerCase();
  return STORED_HANDLE_PATTERN.test(normalizedHandle) ? normalizedHandle : null;
}

/**
 * memo 아이템 생성 입력의 줄바꿈을 `\n`으로 정규화하고 빈 문자열을 거부한다.
 */
const memoContentSchema = z
  .string()
  .transform((value) => value.replace(WINDOWS_LINE_BREAK_PATTERN, "\n"))
  .refine((value) => value.trim().length > 0, {
    message: "Memo content is required.",
  });

const pageItemSizeCodeSchema = z.enum(PAGE_ITEM_SIZE_CODES, {
  message: "Invalid item size.",
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

const pageItemMemoUpdateSchema = z.object({
  type: z.literal("memo"),
  data: z.object({
    content: memoContentSchema,
  }),
});

const pageItemSizeUpdateSchema = z.object({
  type: z.literal("size"),
  data: z.object({
    sizeCode: pageItemSizeCodeSchema,
  }),
});

/**
 * 페이지 아이템 수정 API 입력을 검증한다.
 * 현재는 memo content 수정과 size_code 수정을 지원한다.
 */
export const pageItemUpdateSchema = z.discriminatedUnion("type", [pageItemMemoUpdateSchema, pageItemSizeUpdateSchema]);

export type PageItemUpdateInput = z.infer<typeof pageItemUpdateSchema>;
