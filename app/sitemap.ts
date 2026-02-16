import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/seo/site";
import { findPublicSitemapPages } from "@/service/onboarding/public-page";

const SITE_URL_ORIGIN = new URL(SITE_URL);

export const revalidate = 3600;

const SITEMAP_ROUTES = [
  {
    path: "/",
    changeFrequency: "daily" as const,
    priority: 1,
  },
  {
    path: "/changelog",
    changeFrequency: "weekly" as const,
    priority: 0.7,
  },
  {
    path: "/sign-in",
    changeFrequency: "monthly" as const,
    priority: 0.5,
  },
];

/**
 * 검색 노출 대상 정적/동적 공개 라우트의 sitemap.xml을 생성한다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const staticEntries: MetadataRoute.Sitemap = SITEMAP_ROUTES.map((route) => ({
    url: new URL(route.path, SITE_URL_ORIGIN).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const publicPages = await findPublicSitemapPages();
    const dynamicEntries: MetadataRoute.Sitemap = publicPages.map((page) => ({
      url: new URL(`/${page.handle}`, SITE_URL_ORIGIN).toString(),
      lastModified: page.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const dedupedEntries = new Map<string, MetadataRoute.Sitemap[number]>();

    for (const entry of [...staticEntries, ...dynamicEntries]) {
      dedupedEntries.set(entry.url, entry);
    }

    return Array.from(dedupedEntries.values());
  } catch (error) {
    console.error("[sitemap] Failed to load public handles.", error);
    return staticEntries;
  }
}
