import { z } from "zod";
import { normalizeSocialIdentifier, SOCIAL_PLATFORM_DEFINITIONS, type SocialPlatform } from "@/constants/social-platforms";
import { PAGE_ITEM_MEDIA_ALLOWED_MIME_TYPES, PAGE_ITEM_MEDIA_MAX_FILE_SIZE_BYTES } from "@/service/page/item-media";
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
 * 섹션 아이템 제목 입력은 단일 라인으로 정규화하고 빈 문자열을 거부한다.
 */
const sectionContentSchema = z
  .string()
  .transform((value) => value.replace(LINK_TITLE_LINE_BREAK_PATTERN, " ").trim())
  .refine((value) => value.length > 0, {
    message: "Section content is required.",
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

const SOCIAL_PLATFORM_CODES = SOCIAL_PLATFORM_DEFINITIONS.map((platform) => platform.platform) as [SocialPlatform, ...SocialPlatform[]];

const socialPlatformSchema = z.enum(SOCIAL_PLATFORM_CODES, {
  message: "Invalid social platform.",
});

const pageSocialItemSchema = z
  .object({
    platform: socialPlatformSchema,
    username: z.string(),
  })
  .transform((value) => ({
    platform: value.platform,
    username: normalizeSocialIdentifier(value.platform, value.username),
  }));

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

const pageItemSectionCreateSchema = z.object({
  type: z.literal("section"),
  data: z.object({
    content: sectionContentSchema,
  }),
});

const mapCaptionSchema = z
  .string()
  .optional()
  .transform((value) => (value ?? "").replace(LINK_TITLE_LINE_BREAK_PATTERN, " ").trim());

const pageItemMapCreateSchema = z.object({
  type: z.literal("map"),
  data: z.object({
    lat: z.number().finite().min(-90, { message: "Invalid latitude." }).max(90, { message: "Invalid latitude." }),
    lng: z.number().finite().min(-180, { message: "Invalid longitude." }).max(180, { message: "Invalid longitude." }),
    zoom: z.number().finite().min(0, { message: "Invalid zoom level." }).max(24, { message: "Invalid zoom level." }),
    caption: mapCaptionSchema,
    googleMapUrl: linkUrlSchema,
  }),
});

const pageItemMediaMimeTypeSchema = z
  .string()
  .trim()
  .refine((value) => PAGE_ITEM_MEDIA_ALLOWED_MIME_TYPES.has(value.toLowerCase()), {
    message: "Unsupported media format.",
  });

const pageItemMediaFileSizeSchema = z
  .number()
  .int()
  .positive()
  .max(PAGE_ITEM_MEDIA_MAX_FILE_SIZE_BYTES, { message: "Media file is too large." });

const pageItemImageCreateSchema = z.object({
  type: z.literal("image"),
  data: z.object({
    src: linkUrlSchema,
    mimeType: pageItemMediaMimeTypeSchema.refine((value) => value.toLowerCase().startsWith("image/"), {
      message: "Invalid image format.",
    }),
    fileName: z.string().trim().min(1, { message: "Media file name is required." }),
    fileSize: pageItemMediaFileSizeSchema,
    objectKey: z.string().trim().min(1, { message: "Media object key is required." }),
  }),
});

const pageItemVideoCreateSchema = z.object({
  type: z.literal("video"),
  data: z.object({
    src: linkUrlSchema,
    mimeType: pageItemMediaMimeTypeSchema.refine((value) => value.toLowerCase().startsWith("video/"), {
      message: "Invalid video format.",
    }),
    fileName: z.string().trim().min(1, { message: "Media file name is required." }),
    fileSize: pageItemMediaFileSizeSchema,
    objectKey: z.string().trim().min(1, { message: "Media object key is required." }),
  }),
});

/**
 * 페이지 아이템 생성 API 입력을 검증한다.
 * 현재는 memo/section/link/map/image/video 타입 생성을 지원한다.
 */
export const pageItemCreateSchema = z.discriminatedUnion("type", [
  pageItemMemoCreateSchema,
  pageItemSectionCreateSchema,
  pageItemLinkCreateSchema,
  pageItemMapCreateSchema,
  pageItemImageCreateSchema,
  pageItemVideoCreateSchema,
]);

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

const pageItemSectionUpdateSchema = z.object({
  type: z.literal("section"),
  data: z.object({
    content: sectionContentSchema,
  }),
});

const pageItemMapUpdateSchema = z.object({
  type: z.literal("map"),
  data: z.object({
    lat: z.number().finite().min(-90, { message: "Invalid latitude." }).max(90, { message: "Invalid latitude." }),
    lng: z.number().finite().min(-180, { message: "Invalid longitude." }).max(180, { message: "Invalid longitude." }),
    zoom: z.number().finite().min(0, { message: "Invalid zoom level." }).max(24, { message: "Invalid zoom level." }),
    caption: mapCaptionSchema,
    googleMapUrl: linkUrlSchema,
  }),
});

const pageItemSizeUpdateSchema = z.object({
  type: z.literal("size"),
  data: z.object({
    sizeCode: pageItemSizeCodeSchema,
  }),
});

/**
 * 페이지 아이템 순서 일괄 수정 입력을 검증한다.
 * 전체 아이템 id 배열을 받아 중복 없이 전달되었는지 확인한다.
 */
export const pageItemReorderSchema = z
  .object({
    itemIds: z.array(z.uuid({ message: "Invalid item id." })).min(1, {
      message: "Item order is required.",
    }),
  })
  .superRefine((value, context) => {
    const uniqueItemIds = new Set(value.itemIds);

    if (uniqueItemIds.size !== value.itemIds.length) {
      context.addIssue({
        code: "custom",
        message: "Duplicated item ids are not allowed.",
        path: ["itemIds"],
      });
    }
  });

/**
 * 페이지 아이템 수정 API 입력을 검증한다.
 * 현재는 memo/section content, link title, map data, size_code 수정을 지원한다.
 */
export const pageItemUpdateSchema = z.discriminatedUnion("type", [
  pageItemMemoUpdateSchema,
  pageItemSectionUpdateSchema,
  pageItemLinkUpdateSchema,
  pageItemMapUpdateSchema,
  pageItemSizeUpdateSchema,
]);

export type PageItemUpdateInput = z.infer<typeof pageItemUpdateSchema>;
export type PageItemReorderInput = z.infer<typeof pageItemReorderSchema>;

/**
 * 소셜 계정 일괄 저장 입력을 검증/정규화한다.
 * 빈 식별자는 제외하고, 동일 플랫폼 중복 입력은 마지막 값으로 병합한다.
 */
export const pageSocialItemsUpsertSchema = z
  .object({
    items: z.array(pageSocialItemSchema).max(SOCIAL_PLATFORM_DEFINITIONS.length, { message: "Too many social platform items." }),
  })
  .transform((value) => {
    const dedupedItemsByPlatform = new Map<SocialPlatform, string>();

    for (const item of value.items) {
      if (item.username.length === 0) {
        continue;
      }

      dedupedItemsByPlatform.set(item.platform, item.username);
    }

    return {
      items: Array.from(dedupedItemsByPlatform, ([platform, username]) => ({
        platform,
        username,
      })),
    };
  });

export type PageSocialItemsUpsertInput = z.infer<typeof pageSocialItemsUpsertSchema>;
