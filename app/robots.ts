import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/seo/site";

/**
 * robots.txt를 생성한다.
 * 인덱싱 대상이 아닌 내부 전용 경로는 크롤링에서 제외한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/me", "/onboarding"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
