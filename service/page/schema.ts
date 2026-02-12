import { z } from "zod";
import { PAGE_ITEM_SIZE_CODES } from "@/service/page/item-size";

const STORED_HANDLE_PATTERN = /^@[a-z0-9]{3,20}$/;
const WINDOWS_LINE_BREAK_PATTERN = /\r\n?/g;
const LINK_TITLE_LINE_BREAK_PATTERN = /\r?\n/g;

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

/**
 * 링크 아이템 title 입력은 단일 라인으로 정규화하고 빈 문자열을 거부한다.
 */
const linkTitleSchema = z
  .string()
  .transform((value) => value.replace(LINK_TITLE_LINE_BREAK_PATTERN, " ").trim())
  .refine((value) => value.length > 0, {
    message: "Link title is required.",
  });

/**
 * 링크 아이템 URL은 http/https 절대 경로만 허용한다.
 */
const linkUrlSchema = z
  .string()
  .trim()
  .url({
    message: "Invalid link URL.",
  })
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    {
      message: "Invalid link URL.",
    },
  );

/**
 * 링크 아이템 favicon URL은 선택 입력이며 빈 문자열은 null로 정규화한다.
 */
const linkFaviconSchema = z
  .union([z.string().trim().url({ message: "Invalid favicon URL." }), z.null()])
  .optional()
  .transform((value) => {
    if (!value || value.trim().length === 0) {
      return null;
    }

    return value;
  });

const pageItemSizeCodeSchema = z.enum(PAGE_ITEM_SIZE_CODES, {
  message: "Invalid item size.",
});

const pageItemMemoCreateSchema = z.object({
  type: z.literal("memo"),
  data: z.object({
    content: memoContentSchema,
  }),
});

const pageItemLinkCreateSchema = z.object({
  type: z.literal("link"),
  data: z.object({
    url: linkUrlSchema,
    title: linkTitleSchema,
    favicon: linkFaviconSchema,
  }),
});

/**
 * 페이지 아이템 생성 API 입력을 검증한다.
 * 현재는 memo/link 타입 생성을 지원한다.
 */
export const pageItemCreateSchema = z.discriminatedUnion("type", [pageItemMemoCreateSchema, pageItemLinkCreateSchema]);

export type PageItemCreateInput = z.infer<typeof pageItemCreateSchema>;

const pageItemMemoUpdateSchema = z.object({
  type: z.literal("memo"),
  data: z.object({
    content: memoContentSchema,
  }),
});

const pageItemLinkUpdateSchema = z.object({
  type: z.literal("link"),
  data: z.object({
    title: linkTitleSchema,
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
 * 현재는 memo content, link title, size_code 수정을 지원한다.
 */
export const pageItemUpdateSchema = z.discriminatedUnion("type", [
  pageItemMemoUpdateSchema,
  pageItemLinkUpdateSchema,
  pageItemSizeUpdateSchema,
]);

export type PageItemUpdateInput = z.infer<typeof pageItemUpdateSchema>;
