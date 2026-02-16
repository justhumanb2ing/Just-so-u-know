import { type JsonLdPayload, stringifyJsonLd } from "@/config/seo/json-ld";

export type JsonLdScriptProps = {
  data: JsonLdPayload;
  id?: string;
};

/**
 * Next.js 페이지에 JSON-LD 스크립트를 안전한 형태로 주입한다.
 */
export function JsonLdScript({ data, id }: JsonLdScriptProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      /* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD는 script 문자열 삽입이 필수이며 stringifyJsonLd에서 XSS 완화 처리를 수행한다. */
      dangerouslySetInnerHTML={{
        __html: stringifyJsonLd(data),
      }}
    />
  );
}
