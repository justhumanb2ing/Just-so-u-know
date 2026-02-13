import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PUBLIC_PAGE_SECTION_SHELL_CLASSNAME =
  "md:floating-shadow scrollbar-hide max-h-dvh max-w-lg grow overflow-y-auto px-4 py-10 md:mt-0 md:max-h-[calc(100dvh-2.5rem)] md:rounded-t-[64px] md:border-[0.5px] md:px-10";

type PublicPageShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * 공개 페이지의 소유자/방문자 섹션이 동일한 외곽 레이아웃을 공유하도록 고정한다.
 */
export function PublicPageShell({ children, className }: PublicPageShellProps) {
  return <section className={cn(PUBLIC_PAGE_SECTION_SHELL_CLASSNAME, className)}>{children}</section>;
}
