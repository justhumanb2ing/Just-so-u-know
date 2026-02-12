/**
 * 페이지 아이템 사이즈 코드는 DB `public.item_size` 시드와 1:1로 맞춘다.
 */
export const PAGE_ITEM_SIZE_CODES = ["wide-short", "wide-tall", "wide-full"] as const;

export type PageItemSizeCode = (typeof PAGE_ITEM_SIZE_CODES)[number];
