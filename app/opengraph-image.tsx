import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DEFAULT_OG_IMAGE_HEIGHT, DEFAULT_OG_IMAGE_WIDTH, SITE_NAME } from "@/config/seo/site";

export const runtime = "nodejs";

export const alt = `${SITE_NAME} Open Graph Image`;

export const size = {
  width: DEFAULT_OG_IMAGE_WIDTH,
  height: DEFAULT_OG_IMAGE_HEIGHT,
};

export const contentType = "image/png";

let a2zBoldFontPromise: Promise<Buffer> | null = null;
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
 * 사이트 기본 Open Graph 이미지를 동적으로 생성한다.
 */
export default async function OpenGraphImage() {
  const [a2zBoldFont, logoDataUrl] = await Promise.all([loadA2zBoldFont(), loadLogoDataUrl()]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "3px",
          fontFamily: "A2Z",
          fontSize: 60,
          fontWeight: 500,
          letterSpacing: "-0.05em",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse에서는 next/image를 사용할 수 없다. */}
        <img
          src={logoDataUrl}
          alt=""
          style={{
            width: "160px",
            height: "160px",
          }}
        />
        <span>Just so u know</span>
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
      ],
      headers: {
        "X-Robots-Tag": "noindex, noimageindex",
      },
    },
  );
}
