import { z } from "zod";

const MAPBOX_GEOCODE_FORWARD_ENDPOINT = "https://api.mapbox.com/search/geocode/v6/forward";
const DEFAULT_SEARCH_LANGUAGE = "ko,en";
const SEARCH_LIMIT = "5";
const SEARCH_TYPES = "country,place";

const mapboxFeatureSchema = z.object({
  id: z.string(),
  text: z.string().nullish(),
  place_name: z.string().nullish(),
  center: z.tuple([z.number(), z.number()]).optional(),
  geometry: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .nullish(),
});

const mapboxForwardGeocodeSchema = z.object({
  type: z.string().optional(),
  features: z.array(mapboxFeatureSchema),
});

export type MapSearchResultItem = {
  id: string;
  name: string;
  fullName: string;
  center: [number, number];
};

type MapSearchSuccess = {
  ok: true;
  data: MapSearchResultItem[];
};

type MapSearchFailure = {
  ok: false;
  status: number;
  error: string;
};

export type MapSearchResult = MapSearchSuccess | MapSearchFailure;

type RequestMapSearchByQueryOptions = {
  language?: string;
  fetchImpl?: typeof fetch;
};

/**
 * 브라우저/사용자 언어 힌트를 Mapbox language 파라미터 형식으로 정규화한다.
 */
export function normalizeMapSearchLanguage(rawLanguage: string | null | undefined) {
  const fallback = DEFAULT_SEARCH_LANGUAGE;
  if (!rawLanguage) {
    return fallback;
  }

  const normalized = rawLanguage
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => item.split("-")[0] ?? item);

  if (!normalized.length) {
    return fallback;
  }

  const deduped = Array.from(new Set([...normalized, "ko", "en"]));
  return deduped.join(",");
}

/**
 * Mapbox forward geocode 요청 URL을 구성한다.
 */
export function buildMapboxForwardGeocodeUrl(params: { query: string; accessToken: string; language: string }) {
  const endpoint = new URL(MAPBOX_GEOCODE_FORWARD_ENDPOINT);
  endpoint.searchParams.set("q", params.query);
  endpoint.searchParams.set("access_token", params.accessToken);
  endpoint.searchParams.set("language", params.language);
  endpoint.searchParams.set("limit", SEARCH_LIMIT);
  endpoint.searchParams.set("autocomplete", "true");
  endpoint.searchParams.set("types", SEARCH_TYPES);
  endpoint.searchParams.set("format", "v5");
  return endpoint;
}

/**
 * Mapbox feature를 지도 검색 UI에서 사용할 아이템으로 변환한다.
 */
export function mapMapboxFeatureToResultItem(feature: z.infer<typeof mapboxFeatureSchema>): MapSearchResultItem | null {
  const center = feature.center ?? feature.geometry?.coordinates;
  if (!center) {
    return null;
  }

  const primaryName = feature.text?.trim() || feature.place_name?.trim();
  const fullName = feature.place_name?.trim() || primaryName;
  if (!primaryName || !fullName) {
    return null;
  }

  return {
    id: feature.id,
    name: primaryName,
    fullName,
    center,
  };
}

/**
 * Mapbox geocoding API를 호출해 위치 검색 결과를 반환한다.
 */
export async function requestMapSearchByQuery(rawQuery: string, options: RequestMapSearchByQueryOptions = {}): Promise<MapSearchResult> {
  const query = rawQuery.trim();
  if (!query) {
    return { ok: true, data: [] };
  }

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      ok: false,
      status: 500,
      error: "MAPBOX_ACCESS_TOKEN is not configured.",
    };
  }

  const language = normalizeMapSearchLanguage(options.language);
  const endpoint = buildMapboxForwardGeocodeUrl({ query, accessToken, language });
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
      status: 502,
      error: "Failed to reach map search service.",
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Invalid map search response payload.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status || 502,
      error: "Map search request failed.",
    };
  }

  const parsed = mapboxForwardGeocodeSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      status: 502,
      error: "Unexpected map search response schema.",
    };
  }

  const items = parsed.data.features.map(mapMapboxFeatureToResultItem).filter((item): item is MapSearchResultItem => item !== null);
  return {
    ok: true,
    data: items,
  };
}
