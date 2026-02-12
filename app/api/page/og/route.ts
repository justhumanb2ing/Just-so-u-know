import type { NextRequest } from "next/server";
import { requestOgCrawlByUrl } from "@/service/page/og-crawl";

export const runtime = "nodejs";

/**
 * 링크 URL을 받아 외부 OG 크롤러 응답을 그대로 중계한다.
 */
export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return Response.json(
      {
        status: "error",
        message: "URL is required.",
      },
      { status: 400 },
    );
  }

  const crawlResult = await requestOgCrawlByUrl(targetUrl);

  if (!crawlResult.ok) {
    const status = crawlResult.status && crawlResult.status >= 400 ? crawlResult.status : 502;

    return Response.json(
      {
        status: "error",
        message: crawlResult.error,
      },
      { status },
    );
  }

  return Response.json({
    status: "success",
    data: crawlResult.data,
  });
}
