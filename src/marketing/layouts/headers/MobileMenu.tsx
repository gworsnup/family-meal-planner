import Link from "next/link";

type MobileMenuProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen(false)}>
        Close
      </button>
      <ul>
        <li>
          <Link href="/features" onClick={() => setIsOpen(false)}>
            Features
          </Link>
        </li>
        <li>
          <Link href="/pricing" onClick={() => setIsOpen(false)}>
            Pricing
          </Link>
        </li>
        <li>
          <Link href="/blog" onClick={() => setIsOpen(false)}>
            Blog
          </Link>
        </li>
        <li>
          <Link href="/about" onClick={() => setIsOpen(false)}>
            About
          </Link>
        </li>
        <li>
          <Link href="/contact" onClick={() => setIsOpen(false)}>
            Contact
          </Link>
        </li>
      </ul>
    </div>
  );
}
