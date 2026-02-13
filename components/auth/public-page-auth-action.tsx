import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type PublicPageAuthActionProps = {
  hasSession: boolean;
  isOwnerPage: boolean;
  userImage: string | null;
  userName: string | null;
  size?: "sm" | "lg";
  returnTo?: string;
};

export type PublicPageAuthActionType = "my-page" | "sign-in";
type ResolvePublicPageSignInHrefParams = Pick<PublicPageAuthActionProps, "returnTo">;

/**
 * 공개 페이지에서 Sign out을 제외한 인증 CTA 타입을 계산한다.
 * 본인 페이지에서는 Sign out 전용 컴포넌트가 책임지므로 null을 반환한다.
 */
export function resolvePublicPageAuthActionType({
  hasSession,
  isOwnerPage,
}: Pick<PublicPageAuthActionProps, "hasSession" | "isOwnerPage">): PublicPageAuthActionType | null {
  if (hasSession && isOwnerPage) {
    return null;
  }

  if (!hasSession) {
    return "sign-in";
  }

  return "my-page";
}

/**
 * 공개 페이지 Sign in CTA href를 계산한다.
 * returnTo가 있으면 로그인 후 복귀 경로를 포함한다.
 */
export function resolvePublicPageSignInHref({ returnTo }: ResolvePublicPageSignInHrefParams) {
  if (!returnTo) {
    return "/sign-in";
  }

  return `/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
}

function UserAvatar({ userImage, userName }: Pick<PublicPageAuthActionProps, "userImage" | "userName">) {
  const fallbackText = (userName?.trim().charAt(0) || "U").toUpperCase();

  return (
    <Avatar size="sm" className="bg-muted">
      {userImage ? <AvatarImage src={userImage} alt="My profile" /> : null}
      <AvatarFallback className="font-semibold text-[11px]">{fallbackText}</AvatarFallback>
    </Avatar>
  );
}

function HomeButton({ size = "sm" }: Pick<PublicPageAuthActionProps, 'size'>) {
  return (
    <Button
      variant="ghost"
      size={size}
      className="rounded-sm py-4 text-muted-foreground"
      nativeButton={false}
      render={
        <Link href={"/"} prefetch={false}>
          Home
        </Link>
      }
    />
  );
}

/**
 * 공개 페이지 상단 인증 CTA를 렌더링한다.
 */
export function PublicPageAuthAction({ hasSession, isOwnerPage, userImage, userName, size = "sm", returnTo }: PublicPageAuthActionProps) {
  const actionType = resolvePublicPageAuthActionType({ hasSession, isOwnerPage });
  const signInHref = resolvePublicPageSignInHref({ returnTo });

  if (actionType === null) {
    return null;
  }

  if (actionType === "my-page") {
    return (
      <div className="flex items-center">
        <Button
          variant="ghost"
          size={size}
          className="rounded-sm py-4 text-muted-foreground"
          nativeButton={false}
          render={
            <Link href="/me" prefetch={false}>
              <UserAvatar userImage={userImage} userName={userName} />
              <span className="text-xs">My Page</span>
            </Link>
          }
        />
        <HomeButton size={size} />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size={size}
        className="rounded-sm py-4 text-muted-foreground"
        nativeButton={false}
        render={
          <Link href={signInHref} prefetch={false}>
            Sign In
          </Link>
        }
      />
      <HomeButton size={size} />
    </div>
  );
}
