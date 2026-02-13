import Link from "next/link";
import { buildConnectedSocialLinkItems, type ConnectedSocialItem } from "@/components/public-page/connected-social-items-model";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type { ConnectedSocialItem } from "@/components/public-page/connected-social-items-model";
export { buildConnectedSocialLinkItems } from "@/components/public-page/connected-social-items-model";

type ConnectedSocialItemsProps = {
  items: ConnectedSocialItem[];
  className?: string;
};

/**
 * 사용자가 연결한 소셜 계정을 아이콘+라벨 배지 링크 목록으로 렌더링한다.
 */
export function ConnectedSocialItems({ items, className }: ConnectedSocialItemsProps) {
  const socialLinkItems = buildConnectedSocialLinkItems(items);

  if (socialLinkItems.length === 0) {
    return null;
  }

  return (
    <section className={cn("flex flex-wrap gap-2 px-4", className)}>
      {socialLinkItems.map(({ key, href, label, Icon }) => (
        <Badge
          key={key}
          variant="secondary"
          className="p-3 px-2 text-foreground text-sm transition-colors hover:bg-muted/80"
          render={
            <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${label} profile`} prefetch={false}>
              <Icon
                aria-hidden="true"
                className="size-4 fill-black [&_circle]:fill-black [&_ellipse]:fill-black [&_path]:fill-black [&_polygon]:fill-black [&_rect]:fill-black"
              />
              <span>{label}</span>
            </Link>
          }
        ></Badge>
      ))}
    </section>
  );
}
