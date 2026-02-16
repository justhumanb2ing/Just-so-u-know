import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteTracker } from "@/components/analytics/route-tracker";
import { UmamiScript } from "@/components/analytics/umami-script";
import "./globals.css";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { Toaster } from "@/components/ui/sonner";
import { a2zSans } from "@/config/font";
import { createWebSiteJsonLd } from "@/config/seo/json-ld";
import { createRootMetadata } from "@/config/seo/metadata";

export const metadata: Metadata = createRootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={a2zSans.variable}>
      <body className={`h-dvh antialiased`}>
        <UmamiScript />
        <Suspense fallback={null}>
          <RouteTracker />
        </Suspense>
        <JsonLdScript id="website-json-ld" data={createWebSiteJsonLd()} />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
