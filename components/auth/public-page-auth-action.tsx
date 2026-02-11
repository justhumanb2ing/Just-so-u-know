import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";

type PublicPageAuthActionProps = {
  hasSession: boolean;
  isOwnerPage: boolean;
  userImage: string | null;
  userName: string | null;
};

export type PublicPageAuthActionType = "my-page" | "sign-in" | "sign-out";

/**
 * 공개 페이지에서 인증 상태와 소유 여부에 따라 노출할 CTA 타입을 계산한다.
 */
export function resolvePublicPageAuthActionType({
  hasSession,
  isOwnerPage,
}: Pick<PublicPageAuthActionProps, "hasSession" | "isOwnerPage">): PublicPageAuthActionType {
  if (!hasSession) {
    return "sign-in";
  }

  if (isOwnerPage) {
    return "sign-out";
  }

  return "my-page";
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

/**
 * 공개 페이지 상단 인증 CTA를 렌더링한다.
 */
export function PublicPageAuthAction({ hasSession, isOwnerPage, userImage, userName }: PublicPageAuthActionProps) {
  const actionType = resolvePublicPageAuthActionType({ hasSession, isOwnerPage });

  if (actionType === "sign-out") {
    return (
      <SignOutButton
        variant="link"
        label="Sign out"
        size={"sm"}
        className="h-9 rounded-full px-4 py-0 text-foreground"
        wrapperClassName="items-end"
      />
    );
  }

  if (actionType === "my-page") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="rounded-sm py-4"
        render={
          <Link href="/me" prefetch={false}>
            <UserAvatar userImage={userImage} userName={userName} />
            <span className="text-xs">My Page</span>
          </Link>
        }
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-sm py-4"
      render={
        <Link href="/sign-in" prefetch={false}>
          Sign In
        </Link>
      }
    />
  );
}
