import Link from "next/link";
import { Clock } from "./clock";

export default function LandingHeader() {
  return (
    <header className="container mx-auto py-4">
      <nav className="flex items-center justify-between">
        <aside>
          <Link href={"/"}>로고</Link>
        </aside>
        <aside>
          <Clock />
        </aside>
      </nav>
    </header>
  );
}
