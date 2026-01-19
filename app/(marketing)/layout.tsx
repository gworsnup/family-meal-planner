export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
        }}
      >
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <a
            href="/"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            FamilyTable
          </a>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <a href="/features" style={{ textDecoration: "none", color: "inherit" }}>
              Features
            </a>
            <a href="/pricing" style={{ textDecoration: "none", color: "inherit" }}>
              Pricing
            </a>
            <a href="/blog" style={{ textDecoration: "none", color: "inherit" }}>
              Blog
            </a>
            <a href="/about" style={{ textDecoration: "none", color: "inherit" }}>
              About
            </a>
            <a href="/contact" style={{ textDecoration: "none", color: "inherit" }}>
              Contact
            </a>
          </div>
        </nav>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
