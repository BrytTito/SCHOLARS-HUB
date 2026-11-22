import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

/**
 * Absolute origin for canonical URLs and social images.
 *
 * Resolved in order: an explicit override (custom domains), Railway's generated
 * domain, then localhost. Values are read at build time for static pages, which
 * is why NEXT_PUBLIC_SITE_URL exists — a typo should not fail the build, so an
 * unusable value is ignored rather than thrown.
 */
function origin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).origin;
  } catch {
    return undefined;
  }
}

const siteUrl =
  origin(process.env.NEXT_PUBLIC_SITE_URL) ??
  origin(process.env.RAILWAY_PUBLIC_DOMAIN) ??
  origin(process.env.VERCEL_URL) ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Scholars Hub — weekly interactive study groups",
    template: "%s · Scholars Hub",
  },
  description:
    "Register for Scholars Hub: pick 1–3 courses, pay GH₵10 per course per week, join study channels with polls and keep a personal timetable.",
};

/**
 * Browser chrome colour, matching the brand blue in `app/icon.svg`.
 * Kept in `viewport` because Next 14 moved `themeColor` out of `metadata`.
 */
export const viewport: Viewport = {
  themeColor: "#2563eb",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
