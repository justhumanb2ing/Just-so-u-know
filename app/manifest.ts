import type { MetadataRoute } from "next";
import { SITE_DEFAULT_DESCRIPTION, SITE_DEFAULT_LOCALE, SITE_NAME } from "@/config/seo/site";

/**
 * Next.js metadata route 규약에 맞춰 웹 앱 매니페스트를 생성한다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    start_url: "/",
    id: "/",
    scope: "/",
    lang: SITE_DEFAULT_LOCALE.replace("_", "-"),
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
