import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const PRODUCT_NAME = "FamilyTable";
const TAGLINE = "Plan meals. Save recipes. Shop smarter.";
const SHORT_DESCRIPTION =
  "A shared household meal planner. Import recipes from anywhere, drag-and-drop your week, and generate a shopping list in seconds.";
const LONG_DESCRIPTION =
  "FamilyTable helps households save recipes from TikTok, Instagram, and any site, plan meals on a calendar, and automatically build a weekly shopping list. One shared workspace, simple access, built for busy weeknights.";

const baseUrl =
  process.env.APP_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://www.familytable.me";
const resolvedBaseUrl = baseUrl.startsWith("http")
  ? baseUrl
  : `https://${baseUrl}`;
const metadataBase = new URL(resolvedBaseUrl);

const isPreviewEnv =
  ["preview", "development"].includes(process.env.VERCEL_ENV ?? "") ||
  process.env.NODE_ENV === "development";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: `${PRODUCT_NAME} • ${TAGLINE}`,
    template: `%s • ${PRODUCT_NAME}`,
  },
  description: SHORT_DESCRIPTION,
  applicationName: PRODUCT_NAME,
  manifest: "/site.webmanifest",
  themeColor: "#ffffff",
  robots: {
    index: !isPreviewEnv,
    follow: !isPreviewEnv,
  },
  openGraph: {
    title: PRODUCT_NAME,
    description: SHORT_DESCRIPTION,
    url: metadataBase,
    siteName: PRODUCT_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PRODUCT_NAME,
    description: SHORT_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        rel: "icon",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        rel: "icon",
      },
    ],
  },
  other: {
    "application-name": PRODUCT_NAME,
    "apple-mobile-web-app-title": PRODUCT_NAME,
    "og:locale": "en_US",
    "description:long": LONG_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${openSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
