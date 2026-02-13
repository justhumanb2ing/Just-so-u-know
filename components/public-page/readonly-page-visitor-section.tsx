import Image from "next/image";
import { ConnectedSocialItems } from "@/components/public-page/connected-social-items";
import {
  PUBLIC_PAGE_BIO_FIELD_CLASSNAME,
  PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME,
  PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE,
  PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_NAME_FIELD_CLASSNAME,
  PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { PublicPageShell } from "@/components/public-page/public-page-shell";
import { ReadonlyPageItemSection } from "@/components/public-page/readonly-page-item-section";
import type { PublicPageRow } from "@/service/onboarding/public-page";
import type { VisiblePageItem } from "@/service/page/items";
import type { VisiblePageSocialItem } from "@/service/page/social-items";

type ReadonlyPageVisitorSectionProps = {
  page: Pick<PublicPageRow, "handle" | "name" | "bio" | "image">;
  socialItems: VisiblePageSocialItem[];
  items: VisiblePageItem[];
};

/**
 * 방문자 읽기 모드에서 프로필/소셜/아이템을 서버 컴포넌트로 조합해 렌더링한다.
 */
export function ReadonlyPageVisitorSection({ page, socialItems, items }: ReadonlyPageVisitorSectionProps) {
  return (
    <PublicPageShell>
      <section className={PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME}>
        {page.image ? (
          <div className={PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME}>
            <Image
              src={page.image}
              alt={`${page.name ?? page.handle} profile`}
              fill
              quality={75}
              unoptimized
              loading="eager"
              sizes={PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE}
              className={PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME}
            />
          </div>
        ) : null}
        <section className={PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME}>
          <h1 className={PUBLIC_PAGE_NAME_FIELD_CLASSNAME}>{page.name ?? page.handle}</h1>
          {page.bio ? <p className={PUBLIC_PAGE_BIO_FIELD_CLASSNAME}>{page.bio}</p> : null}
        </section>
        <ConnectedSocialItems items={socialItems} />
        <ReadonlyPageItemSection items={items} />
      </section>
    </PublicPageShell>
  );
}
