import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex items-center justify-between p-4">
      <Link href="/">UStart</Link>
    </nav>
  );
}
