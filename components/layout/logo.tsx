import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <div className="overflow-hideen relative size-12">
      <Link href={"/"} className="font-medium tracking-tighter">
        <Image src={"/logo.png"} alt="logo" width={100} height={100} className="h-full w-full scale-150 rounded-lg object-cover" />
      </Link>
    </div>
  );
}
