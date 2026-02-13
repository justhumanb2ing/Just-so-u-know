import type { ReactNode } from "react";
import {
  normalizeReadonlyPageItems,
  type ReadonlyPageItem,
  resolveReadonlyLinkView,
  resolveReadonlyMemoContent,
  resolveReadonlyPageItemDisplayText,
} from "@/components/public-page/readonly-page-item-view";
import { cn } from "@/lib/utils";
import type { VisiblePageItem } from "@/service/page/items";

const PAGE_ITEM_CARD_BASE_CLASSNAME = "group relative gap-2 rounded-[16px] bg-muted/70 p-3";

type PageItemCardStyleConfig = {
  className?: string;
  sizeClassByCode?: Partial<Record<ReadonlyPageItem["sizeCode"], string>>;
};

const DEFAULT_PAGE_ITEM_CARD_STYLE_CONFIG: PageItemCardStyleConfig = {
  className: "overflow-visible",
};

const PAGE_ITEM_CARD_STYLE_CONFIG_MAP: Record<string, PageItemCardStyleConfig> = {
  memo: {
    className: "overflow-visible",
  },
  link: {
    className: "overflow-visible p-2 flex flex-col justify-center",
  },
  image: {
    className: "overflow-visible",
  },
};

function getItemCardSizeClass(sizeCode: ReadonlyPageItem["sizeCode"]) {
  if (sizeCode === "wide-short") {
    return "h-16";
  }

  if (sizeCode === "wide-tall") {
    return "h-40";
  }

  return "aspect-square";
}

function resolvePageItemCardClassName(item: ReadonlyPageItem) {
  const styleConfig = PAGE_ITEM_CARD_STYLE_CONFIG_MAP[item.typeCode] ?? DEFAULT_PAGE_ITEM_CARD_STYLE_CONFIG;
  const sizeClass = styleConfig.sizeClassByCode?.[item.sizeCode] ?? getItemCardSizeClass(item.sizeCode);

  return cn(PAGE_ITEM_CARD_BASE_CLASSNAME, sizeClass, styleConfig.className);
}

function ReadonlyMemoItem({ item }: { item: ReadonlyPageItem }) {
  const memoContent = resolveReadonlyMemoContent(item);
  const fallbackText = resolveReadonlyPageItemDisplayText(item);
  const displayText = memoContent.length > 0 ? memoContent : fallbackText;

  return (
    <p className="wrap-break-word h-full min-h-0 w-full whitespace-pre-wrap rounded-sm p-2 font-medium text-base! leading-relaxed">
      {displayText}
    </p>
  );
}

function ReadonlyLinkItem({ item }: { item: ReadonlyPageItem }) {
  const { title, url, faviconSrc } = resolveReadonlyLinkView(item);
  const displayTitle = title || resolveReadonlyPageItemDisplayText(item);
  const faviconAlt = `${title || "Link"} favicon`;
  const faviconElement = (
    <>
      {/* biome-ignore lint/performance/noImgElement: 읽기 전용 링크 카드도 favicon은 img 태그 렌더를 유지한다. */}
      <img src={faviconSrc} alt={faviconAlt} width={40} height={40} className="size-10 rounded-sm object-cover" />
    </>
  );

  return (
    <div className="flex h-full w-full items-center gap-3">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
          {faviconElement}
        </a>
      ) : (
        faviconElement
      )}
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <p className="h-10 min-h-0 w-full truncate rounded-sm p-2 font-medium text-base! leading-normal">{displayTitle}</p>
      </div>
    </div>
  );
}

function ReadonlyImageItem({ item }: { item: ReadonlyPageItem }) {
  return (
    <p className="wrap-break-word line-clamp-2 h-fit w-full whitespace-pre-wrap text-base italic">
      {resolveReadonlyPageItemDisplayText(item)}
    </p>
  );
}

function ReadonlyDefaultItem({ item }: { item: ReadonlyPageItem }) {
  return (
    <p className="wrap-break-word line-clamp-2 h-fit w-full whitespace-pre-wrap text-base">{resolveReadonlyPageItemDisplayText(item)}</p>
  );
}

function renderReadonlyItemContent(item: ReadonlyPageItem): ReactNode {
  if (item.typeCode === "memo") {
    return <ReadonlyMemoItem item={item} />;
  }

  if (item.typeCode === "link") {
    return <ReadonlyLinkItem item={item} />;
  }

  if (item.typeCode === "image") {
    return <ReadonlyImageItem item={item} />;
  }

  return <ReadonlyDefaultItem item={item} />;
}

type ReadonlyPageItemSectionProps = {
  items: VisiblePageItem[];
};

/**
 * 방문자 화면에서 전체 타입 아이템 목록을 읽기 전용으로 렌더링한다.
 */
export function ReadonlyPageItemSection({ items }: ReadonlyPageItemSectionProps) {
  const normalizedItems = normalizeReadonlyPageItems(items);

  if (normalizedItems.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 flex flex-col gap-3 pb-12">
      {normalizedItems.map((item) => (
        <article key={item.id} data-item-type={item.typeCode} data-size-code={item.sizeCode} className={resolvePageItemCardClassName(item)}>
          {renderReadonlyItemContent(item)}
        </article>
      ))}
    </section>
  );
}
