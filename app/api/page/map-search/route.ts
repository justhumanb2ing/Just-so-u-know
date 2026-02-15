import type { NextRequest } from "next/server";
import { normalizeMapSearchLanguage, requestMapSearchByQuery } from "@/service/page/map-search";

export const runtime = "nodejs";

/**
 * 지도 검색어를 받아 Mapbox geocoding 결과를 중계한다.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const languageHint = request.nextUrl.searchParams.get("language");

  if (!query) {
    return Response.json({
      status: "success",
      data: [],
    });
  }

  const result = await requestMapSearchByQuery(query, {
    language: normalizeMapSearchLanguage(languageHint),
  });

  if (!result.ok) {
    return Response.json(
      {
        status: "error",
        message: result.error,
      },
      { status: result.status },
    );
  }

  return Response.json({
    status: "success",
    data: result.data,
  });
}
