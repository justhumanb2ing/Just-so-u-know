import Link from "next/link";
import { Button } from "../ui/button";

/**
 * 홈 화면 CTA는 항상 `/me`로 이동시켜 랜딩 페이지를 정적으로 유지한다.
 */
export default function CTAButton() {
  return (
    <Button
      variant={"default"}
      size={"lg"}
      className={"h-10"}
      render={
        <Link href="/me" prefetch={false}>
          Sign in
        </Link>
      }
    />
  );
}
