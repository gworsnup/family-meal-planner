import Link from "next/link";

export default function Navmenu() {
  return (
    <ul>
      <li>
        <Link href="/features">Features</Link>
      </li>
      <li>
        <Link href="/pricing">Pricing</Link>
      </li>
      <li>
        <Link href="/blog">Blog</Link>
      </li>
      <li>
        <Link href="/about">About</Link>
      </li>
      <li>
        <Link href="/contact">Contact</Link>
      </li>
    </ul>
  );
}
