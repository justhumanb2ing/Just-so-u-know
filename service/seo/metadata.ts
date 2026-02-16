import type { Metadata } from "next";
import { createNoIndexMetadata, createOpenGraphImages, createTwitterImages } from "@/config/seo/metadata";
import { SITE_NAME } from "@/config/seo/site";

export type PublicProfileMetadataInput = {
  handle: string;
  name: string | null;
  bio: string | null;
  image: string | null;
};

export type PrivateProfileMetadataInput = {
  handle: string;
  name: string | null;
};

/**
 * 공개 프로필 페이지의 메타데이터를 생성한다.
 */
export function createPublicProfileMetadata({ handle, name, bio, image }: PublicProfileMetadataInput): Metadata {
  const profilePath = `/${handle}`;
  const displayName = name?.trim() || handle;
  const description = bio?.trim() || `${displayName} profile on ${SITE_NAME}.`;

  return {
    title: displayName,
    description,
    alternates: {
      canonical: profilePath,
    },
    openGraph: {
      type: "profile",
      title: displayName,
      description,
      url: profilePath,
      siteName: SITE_NAME,
      images: createOpenGraphImages(image),
    },
    twitter: {
      card: "summary_large_image",
      title: displayName,
      description,
      images: createTwitterImages(image),
    },
  };
}

/**
 * 비공개 프로필 페이지는 검색 노출을 차단한다.
 */
export function createPrivateProfileMetadata({ handle, name }: PrivateProfileMetadataInput): Metadata {
  return createNoIndexMetadata({
    title: name?.trim() || handle,
    description: "This profile is private.",
  });
}

/**
 * 존재하지 않는 프로필 라우트는 색인 제외 메타를 반환한다.
 */
export function createProfileNotFoundMetadata(): Metadata {
  return createNoIndexMetadata({
    title: "Profile not found",
    description: "The profile you are looking for does not exist.",
  });
}
