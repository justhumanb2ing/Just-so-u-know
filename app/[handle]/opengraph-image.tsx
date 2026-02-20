import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DEFAULT_OG_IMAGE_HEIGHT, DEFAULT_OG_IMAGE_WIDTH, SITE_NAME } from "@/config/seo/site";
import { findPublicPageByPathHandle } from "@/service/onboarding/public-page";

export const runtime = "nodejs";

export const alt = `${SITE_NAME} Profile Open Graph Image`;

export const size = {
  width: DEFAULT_OG_IMAGE_WIDTH,
  height: DEFAULT_OG_IMAGE_HEIGHT,
};

export const contentType = "image/png";

type HandleOpenGraphImageProps = {
  params: Promise<{
    handle: string;
  }>;
};

let a2zBoldFontPromise: Promise<Buffer> | null = null;
let a2zMediumFontPromise: Promise<Buffer> | null = null;
let logoDataUrlPromise: Promise<string> | null = null;

/**
 * ImageResponse에서 사용할 A2Z Bold 폰트 데이터를 최초 1회만 로드한다.
 */
function loadA2zBoldFont() {
  if (!a2zBoldFontPromise) {
    a2zBoldFontPromise = readFile(join(process.cwd(), "public/font/a2z-bold.otf")).then((fontData) => fontData);
  }

  return a2zBoldFontPromise;
}

/**
 * ImageResponse에서 사용할 A2Z Medium 폰트 데이터를 최초 1회만 로드한다.
 */
function loadA2zMediumFont() {
  if (!a2zMediumFontPromise) {
    a2zMediumFontPromise = readFile(join(process.cwd(), "public/font/a2z-medium.otf")).then((fontData) => fontData);
  }

  return a2zMediumFontPromise;
}

/**
 * ImageResponse에서 사용할 로고 PNG를 data URL로 변환해 최초 1회만 로드한다.
 */
function loadLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = readFile(join(process.cwd(), "public/logo.png")).then(
      (logoBuffer) => `data:image/png;base64,${logoBuffer.toString("base64")}`,
    );
  }

  return logoDataUrlPromise;
}

/**
 * 경로 파라미터를 OG 이미지 표기용 handle 문자열로 정규화한다.
 */
function toDisplayHandle(pathHandle: string, storedHandle?: string | null) {
  if (storedHandle) {
    return storedHandle;
  }

  const decodedHandle = decodeURIComponent(pathHandle).trim();

  if (!decodedHandle) {
    return "@unknown";
  }

  return decodedHandle.startsWith("@") ? decodedHandle : `@${decodedHandle}`;
}

/**
 * 공개 프로필 라우트용 Open Graph 이미지를 생성한다.
 * 원형 프로필 이미지와 handle 텍스트를 세로 레이아웃으로 표시한다.
 */
export default async function OpenGraphImage({ params }: HandleOpenGraphImageProps) {
  const { handle } = await params;
  const page = await findPublicPageByPathHandle(handle);
  const pageImageUrl = page?.image?.trim() || null;
  const displayHandle = toDisplayHandle(handle, page?.handle);
  const [a2zBoldFont, a2zMediumFont, logoDataUrl] = await Promise.all([loadA2zBoldFont(), loadA2zMediumFont(), loadLogoDataUrl()]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "36px",
        background: "#fff",
      }}
    >
      {pageImageUrl ? (
        /* biome-ignore lint/performance/noImgElement: ImageResponse에서는 next/image를 사용할 수 없다. */
        <img
          src={pageImageUrl}
          alt=""
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "9999px",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "9999px",
            background: "#eee",
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          padding: "0 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "A2Z",
            fontSize: 40,
            fontWeight: 700,
            color: "#000",
            letterSpacing: "-0.03em",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {displayHandle}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: ImageResponse에서는 next/image를 사용할 수 없다. */}
          <img
            src={logoDataUrl}
            alt=""
            style={{
              width: "80px",
              height: "80px",
            }}
          />
          <span
            style={{
              fontFamily: "A2Z",
              fontSize: 24,
              fontWeight: 500,
              color: "#000",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {SITE_NAME}
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "A2Z",
          data: a2zBoldFont,
          style: "normal",
          weight: 700,
        },
        {
          name: "A2Z",
          data: a2zMediumFont,
          style: "normal",
          weight: 500,
        },
      ],
      headers: {
        "X-Robots-Tag": "noindex, noimageindex",
      },
    },
  );
}
