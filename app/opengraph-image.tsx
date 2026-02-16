import { ImageResponse } from "next/og";
import { DEFAULT_OG_IMAGE_HEIGHT, DEFAULT_OG_IMAGE_WIDTH, SITE_DEFAULT_DESCRIPTION, SITE_NAME } from "@/config/seo/site";

export const alt = `${SITE_NAME} Open Graph Image`;

export const size = {
  width: DEFAULT_OG_IMAGE_WIDTH,
  height: DEFAULT_OG_IMAGE_HEIGHT,
};

export const contentType = "image/png";

/**
 * 사이트 기본 Open Graph 이미지를 동적으로 생성한다.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        background: "radial-gradient(circle at 20% 20%, #34d399 0%, #111827 45%, #020617 100%)",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.92,
        }}
      >
        {SITE_NAME}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: "90%",
          }}
        >
          Share your profile with one page.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#bfdbfe",
            maxWidth: "90%",
          }}
        >
          {SITE_DEFAULT_DESCRIPTION}
        </div>
      </div>
    </div>,
    {
      ...size,
      headers: {
        "X-Robots-Tag": "noindex, noimageindex",
      },
    },
  );
}
