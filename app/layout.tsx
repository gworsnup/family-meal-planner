import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Meal Planner",
  description: "Household meal planning: Cook, Plan, Shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
