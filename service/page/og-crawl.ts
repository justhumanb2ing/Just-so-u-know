import { z } from "zod";

export const CRAWL_ENDPOINT = "https://n7fqnxkdpenrktu3vh7ygpopva0fvouk.lambda-url.ap-northeast-2.on.aws/api/crawl";
const CRAWL_MODE = "static";
const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;
const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//;
const IPV4_HOST_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/;

const ogDataSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  site_name: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  favicon: z.string().nullable().optional(),
});

const staticTimingMetaSchema = z.object({
  head_only: z.boolean(),
  head_complete: z.boolean(),
  head_bytes: z.number(),
  head_truncated: z.boolean(),
  head_fallback: z.boolean(),
});

const dynamicTimingMetaSchema = z.object({
  launch_reused: z.boolean(),
  browser_age_ms: z.number(),
});

const staticTimingsSchema = z.object({
  fetchMs: z.number().optional(),
  extractMs: z.number().optional(),
  totalMs: z.number().optional(),
  meta: staticTimingMetaSchema.optional(),
});

const dynamicTimingsSchema = z.object({
  launchMs: z.number().optional(),
  navigationMs: z.number().optional(),
  extractMs: z.number().optional(),
  totalMs: z.number().optional(),
  meta: dynamicTimingMetaSchema.optional(),
});

const crawlTimingsSchema = z.object({
  static: staticTimingsSchema.nullable().optional(),
  dynamic: dynamicTimingsSchema.nullable().optional(),
});

const cacheMetaSchema = z.object({
  hit: z.boolean(),
  ttlMs: z.number(),
  ageMs: z.number().optional(),
});

const crawlResponseSchema = z.object({
  ok: z.literal(true),
  mode: z.enum(["auto", "static", "dynamic"]),
  fallback: z.boolean(),
  durationMs: z.number(),
  data: ogDataSchema,
  timings: crawlTimingsSchema.optional(),
  meta: z.object({ static: staticTimingMetaSchema }).optional(),
  cache: cacheMetaSchema.nullable().optional(),
});

const wrappedCrawlSuccessSchema = z.object({
  ok: z.literal(true),
  data: crawlResponseSchema,
});

const crawlFailureSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  status: z.number().optional(),
});

const crawlResultSchema = z.union([wrappedCrawlSuccessSchema, crawlFailureSchema]);

export type OgData = z.infer<typeof ogDataSchema>;
export type StaticTimingMeta = z.infer<typeof staticTimingMetaSchema>;
export type DynamicTimingMeta = z.infer<typeof dynamicTimingMetaSchema>;
export type StaticTimings = z.infer<typeof staticTimingsSchema>;
export type DynamicTimings = z.infer<typeof dynamicTimingsSchema>;
export type CrawlTimings = z.infer<typeof crawlTimingsSchema>;
export type CacheMeta = z.infer<typeof cacheMetaSchema>;
export type CrawlResponse = z.infer<typeof crawlResponseSchema>;
export type CrawlSuccess = z.infer<typeof wrappedCrawlSuccessSchema>;
export type CrawlFailure = z.infer<typeof crawlFailureSchema>;
export type CrawlResult = CrawlSuccess | CrawlFailure;

type RequestOgCrawlByUrlOptions = {
  fetchImpl?: typeof fetch;
  devMode?: boolean;
};

/**
 * 개발 환경 여부를 기준으로 크롤러 디버그 timings 파라미터를 제어한다.
 */
export function isDevMode() {
  return process.env.NODE_ENV !== "production";
}

/**
 * 외부 크롤러 호출 URL을 구성한다.
 */
export function buildCrawlEndpointUrl(url: string, devMode: boolean = isDevMode()) {
  const endpoint = new URL(CRAWL_ENDPOINT);
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("mode", CRAWL_MODE);

  if (devMode) {
    endpoint.searchParams.set("timings", "1");
  }

  return endpoint;
}

/**
 * 입력 URL 문자열을 외부 요청 가능한 절대 URL로 정규화한다.
 */
export function normalizeOgTargetUrl(rawUrl: string) {
  const normalized = rawUrl.trim();

  if (!normalized) {
    return null;
  }

  const hasExplicitScheme = URL_SCHEME_PATTERN.test(normalized);

  if (hasExplicitScheme && !HTTP_PROTOCOL_PATTERN.test(normalized)) {
    return null;
  }

  const targetInput = hasExplicitScheme ? normalized : `https://${normalized}`;

  try {
    const target = new URL(targetInput);

    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return null;
    }

    if (!hasExplicitScheme) {
      const hostname = target.hostname.trim();
      const hasDomainDot = hostname.includes(".");
      const isLocalhost = hostname === "localhost";
      const isIpv4Host = IPV4_HOST_PATTERN.test(hostname);

      if (!hasDomainDot && !isLocalhost && !isIpv4Host) {
        return null;
      }
    }

    return target.toString();
  } catch {
    return null;
  }
}

/**
 * 외부 OG 크롤러를 호출해 결과를 가져온다.
 */
export async function requestOgCrawlByUrl(rawUrl: string, options: RequestOgCrawlByUrlOptions = {}): Promise<CrawlResult> {
  const normalizedUrl = normalizeOgTargetUrl(rawUrl);

  if (!normalizedUrl) {
    return {
      ok: false,
      error: "Invalid URL.",
      status: 400,
    };
  }

  const endpoint = buildCrawlEndpointUrl(normalizedUrl, options.devMode);
  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;

  try {
    response = await fetchImpl(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: "Failed to reach crawl service.",
      status: 502,
    };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: "Invalid crawl response payload.",
      status: 502,
    };
  }

  const parsedPayload = crawlResultSchema.safeParse(payload);
  const parsedDirectSuccessPayload = crawlResponseSchema.safeParse(payload);

  if (parsedDirectSuccessPayload.success) {
    return {
      ok: true,
      data: parsedDirectSuccessPayload.data,
    };
  }

  if (!parsedPayload.success) {
    return {
      ok: false,
      error: "Invalid crawl response payload.",
      status: 502,
    };
  }

  const crawlResult = parsedPayload.data;

  if (!response.ok && crawlResult.ok) {
    return {
      ok: false,
      error: "Crawl request failed.",
      status: response.status,
    };
  }

  if (!crawlResult.ok && !crawlResult.status && response.status >= 400) {
    return {
      ...crawlResult,
      status: response.status,
    };
  }

  return crawlResult;
}
