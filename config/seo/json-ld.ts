import { createAbsoluteUrl } from "./metadata";
import { SITE_NAME } from "./site";

export type JsonLdObject = Record<string, unknown>;

export type JsonLdPayload = JsonLdObject | JsonLdObject[];

/**
 * JSON-LD 문자열 직렬화 시 `<` 문자를 이스케이프해 스크립트 인젝션 위험을 줄인다.
 */
export function stringifyJsonLd(payload: JsonLdPayload) {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/**
 * 사이트 전역 구조화 데이터를 생성한다.
 */
export function createWebSiteJsonLd(): JsonLdObject {
  const siteUrl = createAbsoluteUrl("/");

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    name: SITE_NAME,
    url: siteUrl,
  };
}
