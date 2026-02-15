import { ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  normalizeReadonlyPageItems,
  type ReadonlyPageItem,
  resolveReadonlyLinkView,
  resolveReadonlyMapView,
  resolveReadonlyMediaView,
  resolveReadonlyMemoContent,
  resolveReadonlyPageItemDisplayText,
} from "@/components/public-page/readonly-page-item-view";
import { Map as MapCanvas } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import type { VisiblePageItem } from "@/service/page/items";
import { Button } from "../ui/button";

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
  map: {
    className: "overflow-visible p-0",
  },
  image: {
    className: "overflow-visible p-0",
  },
  video: {
    className: "overflow-visible p-0",
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
  const mediaView = resolveReadonlyMediaView(item);

  if (!mediaView.src) {
    return (
      <p className="wrap-break-word line-clamp-2 h-fit w-full whitespace-pre-wrap text-base italic">
        {resolveReadonlyPageItemDisplayText(item)}
      </p>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-[12px] border">
      {/* biome-ignore lint/performance/noImgElement: 외부 public URL 미디어는 img 태그로 직접 렌더링한다. */}
      <img src={mediaView.src} alt={resolveReadonlyPageItemDisplayText(item)} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

function ReadonlyVideoItem({ item }: { item: ReadonlyPageItem }) {
  const mediaView = resolveReadonlyMediaView(item);

  if (!mediaView.src) {
    return <ReadonlyDefaultItem item={item} />;
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-[12px] border">
      <video className="h-full w-full object-cover" preload="metadata" playsInline muted loop autoPlay>
        <source src={mediaView.src} type={mediaView.mimeType ?? "video/mp4"} />
      </video>
    </div>
  );
}

const NOOP_MAP_VIEWPORT_CHANGE = () => {};

function ReadonlyMapItem({ item }: { item: ReadonlyPageItem }) {
  const mapView = resolveReadonlyMapView(item);

  if (!mapView) {
    return <ReadonlyDefaultItem item={item} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[12px] border">
      <MapCanvas
        viewport={{
          center: [mapView.lng, mapView.lat],
          zoom: mapView.zoom,
        }}
        styles={{
          light: "https://api.maptiler.com/maps/019c603c-4dda-7ea0-ab88-6521888e9715/style.json?key=cBOQsbRDRLWu2ZIg2chC",
        }}
        onViewportChange={NOOP_MAP_VIEWPORT_CHANGE}
        interactive={false}
        className="h-full w-full"
      />
      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="animation-duration-[2.5s] absolute -inset-2 animate-ping rounded-full bg-blue-500 opacity-75" />
        <div className="relative flex size-7 items-center justify-center rounded-full bg-white p-1 shadow-[1px_2px_13px_4px_rgba(0,0,0,0.25)]">
          <div className="size-full rounded-full bg-blue-500" />
        </div>
      </div>
      {mapView.caption ? (
        <div className="pointer-events-none absolute bottom-2 left-2">
          <p className="line-clamp-1 min-w-12 max-w-60 truncate rounded-sm border bg-white/90 px-2 py-2 text-black text-sm">
            {mapView.caption}
          </p>
        </div>
      ) : null}
      <div className="absolute right-2 bottom-3.5 z-20 flex size-7 items-center justify-center rounded-full bg-white shadow-sm">
        <Button
          size={"icon-xs"}
          className={"rounded-full"}
          nativeButton={false}
          render={
            <a href={mapView.googleMapUrl} target="_blank" rel="noreferrer" className="block">
              <ArrowUpRightIcon className="size-4" strokeWidth={3} />
            </a>
          }
        ></Button>
      </div>
      
    </div>
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

  if (item.typeCode === "video") {
    return <ReadonlyVideoItem item={item} />;
  }

  if (item.typeCode === "map") {
    return <ReadonlyMapItem item={item} />;
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
