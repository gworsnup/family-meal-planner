import HeaderOne from "@/src/marketing/layouts/headers/HeaderOne";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <HeaderOne />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
