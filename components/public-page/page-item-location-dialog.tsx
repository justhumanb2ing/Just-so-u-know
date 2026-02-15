"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { type ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
import { Tooltip, TooltipPanel, TooltipTrigger } from "@/components/animate-ui/components/base/tooltip";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Map as MapCanvas, MapControls, type MapViewport } from "@/components/ui/map";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type PageItemLocationDialogProps = {
  trigger: ComponentProps<typeof DialogTrigger>["render"];
};

/**
 * 위치 선택 다이얼로그의 기본 지도 뷰 설정.
 * mapcn의 좌표 순서는 [longitude, latitude]를 사용한다.
 */
const LOCATION_PICKER_MAP_VIEW = {
  center: [126.978, 37.5665] as [number, number],
  zoom: 13,
  minZoom: 7,
  maxZoom: 15,
} as const;
const MAP_SEARCH_DEBOUNCE_MS = 350;

type MapSearchResultItem = {
  id: string;
  name: string;
  fullName: string;
  center: [number, number];
};

/**
 * 아이템 작성 바에서 사용하는 위치 선택 다이얼로그.
 */
export function PageItemLocationDialog({ trigger }: PageItemLocationDialogProps) {
  const [mapViewport, setMapViewport] = useState<MapViewport>({
    center: LOCATION_PICKER_MAP_VIEW.center,
    zoom: LOCATION_PICKER_MAP_VIEW.zoom,
    bearing: 0,
    pitch: 0,
  });
  const [selectedCenter, setSelectedCenter] = useState<[number, number]>(LOCATION_PICKER_MAP_VIEW.center);
  const [query, setQuery] = useState("");
  const [caption, setCaption] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MapSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchLanguage = useMemo(() => {
    if (typeof navigator === "undefined") {
      return "ko,en";
    }

    const sourceLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
    const normalized = sourceLanguages.map((language) => language.toLowerCase().split("-")[0] ?? language.toLowerCase()).filter(Boolean);

    const deduped = Array.from(new Set([...normalized, "ko", "en"]));
    return deduped.join(",");
  }, []);

  /**
   * 지도 이동 이벤트에서 현재 중심 좌표를 상태로 동기화한다.
   */
  const handleViewportChange = useCallback((viewport: MapViewport) => {
    setMapViewport(viewport);
    setSelectedCenter(viewport.center);
  }, []);

  /**
   * 사용자가 검색 결과를 선택하면 지도 중심을 해당 좌표로 이동한다.
   */
  const handleSelectSearchResult = useCallback((item: MapSearchResultItem) => {
    const nextCenter = item.center;
    setMapViewport((prev) => ({
      ...prev,
      center: nextCenter,
      zoom: Math.max(prev.zoom, LOCATION_PICKER_MAP_VIEW.zoom),
    }));
    setSelectedCenter(nextCenter);
    setQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    setSearchError(null);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, MAP_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    const searchParams = new URLSearchParams({
      q: debouncedQuery,
      language: searchLanguage,
    });

    fetch(`/api/page/map-search?${searchParams.toString()}`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          status?: string;
          message?: string;
          data?: MapSearchResultItem[];
        };

        if (!response.ok || payload.status === "error") {
          throw new Error(payload.message || "Failed to search location.");
        }

        return payload.data ?? [];
      })
      .then((items) => {
        setSearchResults(items);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setSearchError("Failed to search location.");
        setSearchResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, searchLanguage]);

  const _formattedCenter = useMemo(
    () => ({
      latitude: selectedCenter[1].toFixed(6),
      longitude: selectedCenter[0].toFixed(6),
    }),
    [selectedCenter],
  );

  return (
    <Dialog>
      <Tooltip delay={0}>
        <TooltipTrigger render={<DialogTrigger render={trigger} />} />
        <TooltipPanel side="top" align="center">
          Location
        </TooltipPanel>
      </Tooltip>
      <DialogContent
        className="max-w-xl overflow-hidden rounded-3xl border-5 border-foreground bg-transparent p-0! shadow-lg"
        bottomStickOnMobile={false}
        showCloseButton={false}
      >
        <DialogHeader className={"sr-only"}>
          <DialogTitle className={"sr-only"}>Select location</DialogTitle>
          <DialogDescription className={"sr-only"}>Zoom, move, and find your current location.</DialogDescription>
        </DialogHeader>
        <div className="relative p-0">
          <MapCanvas
            center={LOCATION_PICKER_MAP_VIEW.center}
            zoom={LOCATION_PICKER_MAP_VIEW.zoom}
            minZoom={LOCATION_PICKER_MAP_VIEW.minZoom}
            maxZoom={LOCATION_PICKER_MAP_VIEW.maxZoom}
            viewport={mapViewport}
            className="aspect-square h-full w-full"
            styles={{
              light: "https://api.maptiler.com/maps/019c603c-4dda-7ea0-ab88-6521888e9715/style.json?key=cBOQsbRDRLWu2ZIg2chC",
            }}
            onViewportChange={handleViewportChange}
          >
            <MapControls position="top-right" showZoom showLocate />
          </MapCanvas>
          <div className="pointer-events-auto absolute top-3 left-3 z-20 w-72">
            <div className="rounded-lg border border-black bg-foreground/95 p-0 shadow-lg backdrop-blur-xs">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                  }}
                  placeholder="Search"
                  className="peer border-none ps-9 pe-13 text-white ring-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                  autoComplete="off"
                  aria-label="Search location"
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <SearchIcon aria-hidden="true" className="size-4" strokeWidth={3} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setDebouncedQuery("");
                    setSearchResults([]);
                    setSearchError(null);
                  }}
                  className={cn(
                    "absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 transition-colors hover:text-white",
                    !query && "pointer-events-none opacity-0",
                  )}
                  aria-label="Clear search query"
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </button>
                {isSearching ? (
                  <Loader2Icon className="pointer-events-none absolute inset-y-0 end-8 my-auto size-4 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              {searchError ? <p className="mt-2 text-destructive text-xs">{searchError}</p> : null}
              {searchResults.length > 0 ? (
                <div className="mt-1 h-44 overflow-hidden border-border/20 border-t">
                  <ScrollArea className="h-full" scrollbarGutter={true}>
                    <ul className="space-y-1">
                      {searchResults.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={cn(
                              "w-full rounded-xs px-2 py-1.5 text-left transition-colors hover:bg-muted/10",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            )}
                            onClick={() => {
                              handleSelectSearchResult(item);
                            }}
                          >
                            <p className="line-clamp-1 font-medium text-white text-xs">{item.name}</p>
                            <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.fullName}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              ) : null}
            </div>
          </div>
          <div className="pointer-events-auto absolute bottom-3 left-3 z-20 w-72">
            <div className="rounded-lg border border-black bg-foreground/95 p-0 shadow-lg backdrop-blur-xs">
              <div className="relative">
                <Input
                  value={caption}
                  onChange={(event) => {
                    setCaption(event.target.value);
                  }}
                  placeholder="Caption"
                  className="peer border-none ps-3 pe-3 text-white ring-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                  autoComplete="off"
                  aria-label="Location caption"
                />
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="animation-duration-[2.5s] absolute -inset-2 animate-ping rounded-full bg-blue-500 opacity-75" />
            <div className="relative flex size-7 items-center justify-center rounded-full bg-white p-1 shadow-[1px_2px_13px_4px_rgba(0,0,0,0.25)]">
              <div className="size-full rounded-full bg-blue-500" />
            </div>
          </div>
          <DialogClose
            className={"absolute top-32 right-2"}
            render={
              <Button size={"icon-lg"} variant={"default"} className={"phantom-border size-9 rounded-md border font-medium text-base"}>
                <XIcon className="size-5" strokeWidth={2.5} />
              </Button>
            }
          ></DialogClose>
          <div className="pointer-events-auto absolute right-3 bottom-3">
            <Button size={"lg"} variant={"default"} className={"phantom-border px-4 text-base"}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
