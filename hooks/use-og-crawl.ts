"use client";

import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CrawlResponse } from "@/service/page/og-crawl";

type OgLookupApiSuccess = {
  status: "success";
  data: CrawlResponse;
};

type OgLookupApiError = {
  status: "error";
  message: string;
};

type SubmitOgLookupOptions = {
  onSuccess?: () => void;
};

export type OgCrawlController = {
  linkUrl: string;
  isPending: boolean;
  lastFetchedOg: CrawlResponse | null;
  handleLinkUrlChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSubmitOgLookup: (event: SubmitEvent, options?: SubmitOgLookupOptions) => void;
};

/**
 * OG 조회 요청용 내부 API URL을 구성한다.
 */
export function buildOgLookupEndpoint(linkUrl: string) {
  const endpoint = new URL("/api/page/og", window.location.origin);
  endpoint.searchParams.set("url", linkUrl);
  return endpoint.toString();
}

/**
 * 링크 URL로 OG를 조회하는 클라이언트 상태/이벤트를 관리한다.
 * 실패 시에만 toast를 노출한다.
 */
export function useOgCrawl(): OgCrawlController {
  const [linkUrl, setLinkUrl] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [lastFetchedOg, setLastFetchedOg] = useState<CrawlResponse | null>(null);

  const handleLinkUrlChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setLinkUrl(event.target.value);
  }, []);

  const handleSubmitOgLookup = useCallback(
    (event: SubmitEvent, options?: SubmitOgLookupOptions) => {
      event.preventDefault();

      const nextLinkUrl = linkUrl.trim();

      if (!nextLinkUrl || isPending) {
        return;
      }

      setIsPending(true);

      void (async () => {
        try {
          const response = await fetch(buildOgLookupEndpoint(nextLinkUrl), {
            method: "GET",
            cache: "no-store",
          });
          const payload = (await response.json()) as OgLookupApiSuccess | OgLookupApiError;

          if (!response.ok || payload.status !== "success") {
            throw new Error(payload.status === "error" ? payload.message : "Failed to crawl OG.");
          }

          setLastFetchedOg(payload.data);
          setLinkUrl("");
          options?.onSuccess?.();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to crawl OG.";

          toast.error("Failed to crawl OG", {
            description: message,
          });
        } finally {
          setIsPending(false);
        }
      })();
    },
    [isPending, linkUrl],
  );

  return {
    linkUrl,
    isPending,
    lastFetchedOg,
    handleLinkUrlChange,
    handleSubmitOgLookup,
  };
}
