import Script from "next/script";
import { UMAMI_SCRIPT_URL, UMAMI_WEBSITE_ID } from "@/config/analytics/umami";

export function UmamiScript() {
  return (
    <Script
      id="umami-script"
      strategy="afterInteractive"
      defer
      src={UMAMI_SCRIPT_URL}
      data-website-id={UMAMI_WEBSITE_ID}
      data-auto-track="false"
    />
  );
}
