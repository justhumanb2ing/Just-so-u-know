"use client";

import { ArrowUpRightIcon, LayersIcon } from "lucide-react";
import dynamic from "next/dynamic";
import type { KeyboardEvent, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Map as MapCanvas } from "@/components/ui/map";
import { Textarea } from "@/components/ui/textarea";
import {
  type MapItemCreatePayload,
  type PageItem,
  resolveLinkItemFavicon,
  resolveLinkItemTitle,
  resolveLinkItemUrl,
  resolveMapItemView,
  resolveMediaItemMimeType,
  resolveMediaItemSrc,
  resolveMemoItemContent,
} from "@/hooks/use-page-item-composer";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const PageItemLocationDialog = dynamic(
  () => import("@/components/public-page/page-item-location-dialog").then((module) => module.PageItemLocationDialog),
  { ssr: false },
);

type PageItemRendererProps = {
  item: PageItem;
  canEditMemo?: boolean;
  onMemoChange?: (itemId: string, nextValue: string) => void;
  canEditLinkTitle?: boolean;
  onLinkTitleChange?: (itemId: string, nextValue: string) => void;
  onLinkTitleSubmit?: (itemId: string) => void;
  canEditMap?: boolean;
  onMapSave?: (itemId: string, payload: MapItemCreatePayload) => Promise<boolean>;
};

type PageItemData = Record<string, unknown>;
type PageItemTextResolver = (data: PageItemData) => string;

export type PageItemRenderer = (props: PageItemRendererProps) => ReactNode;

const FALLBACK_EMPTY_TEXT = "No content";
const FALLBACK_UNSUPPORTED_TEXT = "Unsupported data format";
const DEFAULT_FAVICON_SRC = "/no-favicon.png";
const NOOP_MAP_VIEWPORT_CHANGE = () => {};

function toObjectData(data: unknown): PageItemData | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  return data as PageItemData;
}

function pickFirstText(data: PageItemData, keys: string[]) {
  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function pickFirstPrimitiveText(data: PageItemData) {
  for (const value of Object.values(data)) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }

  return null;
}

const PAGE_ITEM_TEXT_RESOLVER_MAP: Record<string, PageItemTextResolver> = {
  memo: (data) => pickFirstText(data, ["content"]) ?? pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT,
  link: (data) => pickFirstText(data, ["title", "url"]) ?? pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT,
  map: (data) => pickFirstText(data, ["caption", "googleMapUrl"]) ?? pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT,
  image: (data) => pickFirstText(data, ["alt", "caption", "title", "src"]) ?? pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT,
  video: (data) => pickFirstText(data, ["title", "caption", "src"]) ?? pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT,
};

/**
 * 아이템 타입에 따라 렌더링에 사용할 표시 텍스트를 계산한다.
 */
export function resolvePageItemDisplayText(item: PageItem) {
  const data = toObjectData(item.data);

  if (!data) {
    return FALLBACK_EMPTY_TEXT;
  }

  const resolveText = PAGE_ITEM_TEXT_RESOLVER_MAP[item.typeCode];

  if (resolveText) {
    return resolveText(data);
  }

  return pickFirstPrimitiveText(data) ?? FALLBACK_UNSUPPORTED_TEXT;
}

function MemoItemRenderer({ item, canEditMemo = false, onMemoChange }: PageItemRendererProps) {
  const isDisabled = !canEditMemo || !onMemoChange;

  return (
    <Textarea
      value={resolveMemoItemContent(item)}
      disabled={isDisabled}
      onChange={(event) => onMemoChange?.(item.id, event.target.value)}
      className={cn(
        "scrollbar-hide wrap-break-word field-sizing-fixed h-full max-h-full min-h-0 w-full resize-none overflow-y-auto whitespace-pre-wrap rounded-sm border-0 p-2 font-medium text-base! leading-relaxed shadow-none focus-visible:ring-0",
        isDisabled
          ? "cursor-default bg-transparent hover:bg-transparent focus-visible:bg-transparent disabled:cursor-default disabled:bg-transparent disabled:opacity-100"
          : "hover:bg-input/60 focus-visible:bg-input/60",
      )}
    />
  );
}

function LinkItemRenderer({ item, canEditLinkTitle = false, onLinkTitleChange, onLinkTitleSubmit }: PageItemRendererProps) {
  const title = resolveLinkItemTitle(item);
  const url = resolveLinkItemUrl(item);
  const faviconSrc = resolveLinkItemFavicon(item) ?? DEFAULT_FAVICON_SRC;
  const isEditable = canEditLinkTitle && Boolean(onLinkTitleChange);
  const displayTitle = isEditable ? title : title || FALLBACK_UNSUPPORTED_TEXT;

  const handleTitleEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isEditable) {
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    onLinkTitleSubmit?.(item.id);
  };

  return (
    <div className="flex h-full w-full items-center gap-3">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
          {/* biome-ignore lint/performance/noImgElement: 요구사항에 따라 favicon은 img 태그로 렌더링한다. */}
          <img src={faviconSrc} alt={`${title || "Link"} favicon`} width={40} height={40} className="size-10 rounded-sm object-cover" />
        </a>
      ) : (
        <>
          {/* biome-ignore lint/performance/noImgElement: 요구사항에 따라 favicon은 img 태그로 렌더링한다. */}
          <img src={faviconSrc} alt={`${title || "Link"} favicon`} width={40} height={40} className="size-10 rounded-sm object-cover" />
        </>
      )}
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <Input
          value={displayTitle}
          placeholder="Title"
          readOnly={!isEditable}
          onChange={isEditable ? (event) => onLinkTitleChange?.(item.id, event.target.value) : undefined}
          onKeyDown={isEditable ? handleTitleEnter : undefined}
          tabIndex={isEditable ? 0 : -1}
          className={cn(
            "h-10 min-h-0 w-full overflow-hidden truncate rounded-sm border-0 bg-transparent p-2 font-medium text-base! leading-normal shadow-none",
            isEditable
              ? "hover:bg-input/60 focus-visible:bg-input/60 focus-visible:ring-0"
              : "cursor-default hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0",
          )}
        />
      </div>
    </div>
  );
}

function MapItemRenderer({ item, canEditMap = false, onMapSave }: PageItemRendererProps) {
  const mapView = resolveMapItemView(item);

  if (!mapView) {
    return <DefaultItemRenderer item={item} />;
  }

  const canUpdateMap = canEditMap && Boolean(onMapSave);

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
      {canUpdateMap ? (
        <div className="absolute top-2 left-2 z-20">
          <PageItemLocationDialog
            onSaveMapItem={(payload) => onMapSave?.(item.id, payload) ?? Promise.resolve(false)}
            initialValue={{
              lat: mapView.lat,
              lng: mapView.lng,
              zoom: mapView.zoom,
              caption: mapView.caption,
            }}
            trigger={
              <Button type="button" size={"icon-sm"} aria-label="Edit map item" className={"rounded-full"}>
                {/* <PencilIcon className="phatom-border size-4" strokeWidth={3} /> */}
                <LayersIcon className="phatom-border size-4" strokeWidth={3} />
              </Button>
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function ImageItemRenderer({ item }: PageItemRendererProps) {
  const mediaSrc = resolveMediaItemSrc(item);

  if (!mediaSrc) {
    return <DefaultItemRenderer item={item} />;
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-[12px] border">
      {/* biome-ignore lint/performance/noImgElement: 외부 public URL 미디어는 img 태그로 직접 렌더링한다. */}
      <img src={mediaSrc} alt={resolvePageItemDisplayText(item)} className="h-full w-full object-cover" loading="lazy" decoding="async" />
    </div>
  );
}

function VideoItemRenderer({ item }: PageItemRendererProps) {
  const mediaSrc = resolveMediaItemSrc(item);
  const mimeType = resolveMediaItemMimeType(item) ?? "video/mp4";

  if (!mediaSrc) {
    return <DefaultItemRenderer item={item} />;
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-[12px] border">
      <video className="h-full w-full object-cover" preload="metadata" playsInline muted loop autoPlay>
        <source src={mediaSrc} type={mimeType} />
      </video>
    </div>
  );
}

function DefaultItemRenderer({ item }: PageItemRendererProps) {
  return <p className="wrap-break-word line-clamp-2 h-fit w-full whitespace-pre-wrap text-base">{resolvePageItemDisplayText(item)}</p>;
}

const PAGE_ITEM_RENDERER_MAP: Record<string, PageItemRenderer> = {
  memo: MemoItemRenderer,
  link: LinkItemRenderer,
  map: MapItemRenderer,
  image: ImageItemRenderer,
  video: VideoItemRenderer,
};

/**
 * 아이템 타입에 맞는 렌더러 컴포넌트를 반환한다.
 * 미지원 타입은 기본 렌더러를 사용한다.
 */
export function getPageItemRenderer(typeCode: string) {
  return PAGE_ITEM_RENDERER_MAP[typeCode] ?? DefaultItemRenderer;
}
