import type React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="container mx-auto flex h-dvh max-w-md items-center justify-center p-6">{children}</main>;
}
