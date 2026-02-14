import localFont from "next/font/local";

/**
 * 앱 전역 sans 폰트를 A2Z 로컬 폰트로 설정한다.
 * Next.js `next/font/local` 권장 방식에 맞춰 preload와 `swap` 표시 전략을 사용한다.
 */
export const a2zSans = localFont({
  src: [
    { path: "../public/font/a2z-thin.woff2", weight: "100", style: "normal" },
    { path: "../public/font/a2z-extralight.woff2", weight: "200", style: "normal" },
    { path: "../public/font/a2z-light.woff2", weight: "300", style: "normal" },
    { path: "../public/font/a2z-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/font/a2z-medium.woff2", weight: "500", style: "normal" },
    { path: "../public/font/a2z-semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/font/a2z-bold.woff2", weight: "700", style: "normal" },
    { path: "../public/font/a2z-extrabold.woff2", weight: "800", style: "normal" },
    { path: "../public/font/a2z-black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
