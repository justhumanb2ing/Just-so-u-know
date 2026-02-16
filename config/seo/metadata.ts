import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_WIDTH,
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_LOCALE,
  SITE_DEFAULT_TITLE,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  SITE_URL,
} from "./site";

const siteMetadataBase = new URL(SITE_URL);

type OpenGraphImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

/**
 * 상대 경로를 사이트 절대 URL로 정규화한다.
 */
export function createAbsoluteUrl(pathname: string) {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPathname, siteMetadataBase).toString();
}

/**
 * OG 이미지 입력이 없으면 전역 기본 OG 이미지를 사용한다.
 */
export function createOpenGraphImages(imageUrl?: string | null): OpenGraphImage[] {
  if (imageUrl) {
    return [{ url: imageUrl }];
  }

  return [
    {
      url: DEFAULT_OG_IMAGE_PATH,
      width: DEFAULT_OG_IMAGE_WIDTH,
      height: DEFAULT_OG_IMAGE_HEIGHT,
      alt: DEFAULT_OG_IMAGE_ALT,
    },
  ];
}

/**
 * Twitter 카드용 이미지 배열을 생성한다.
 */
export function createTwitterImages(imageUrl?: string | null): string[] {
  if (imageUrl) {
    return [imageUrl];
  }

  return [DEFAULT_OG_IMAGE_PATH];
}

/**
 * 앱 전역 기본 메타데이터를 생성한다.
 */
export function createRootMetadata(): Metadata {
  return {
    metadataBase: siteMetadataBase,
    applicationName: SITE_NAME,
    manifest: "/manifest.webmanifest",
    title: {
      default: SITE_DEFAULT_TITLE,
      template: SITE_TITLE_TEMPLATE,
    },
    description: SITE_DEFAULT_DESCRIPTION,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: SITE_DEFAULT_LOCALE,
      siteName: SITE_NAME,
      url: "/",
      title: SITE_DEFAULT_TITLE,
      description: SITE_DEFAULT_DESCRIPTION,
      images: createOpenGraphImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_DEFAULT_TITLE,
      description: SITE_DEFAULT_DESCRIPTION,
      images: createTwitterImages(),
    },
  };
}

export type NoIndexMetadataInput = {
  title: string;
  description?: string;
};

/**
 * 색인 제외가 필요한 페이지용 메타데이터를 생성한다.
 */
export function createNoIndexMetadata({ title, description }: NoIndexMetadataInput): Metadata {
  return {
    title,
    description: description ?? SITE_DEFAULT_DESCRIPTION,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}
