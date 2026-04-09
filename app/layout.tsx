import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sam Anderson",
  description:
    "Building the platform for physical decision-making at Bricks. Taking on a few engagements a year.",
  metadataBase: new URL("https://sambanderson.com"),
  openGraph: {
    title: "Sam Anderson",
    description:
      "Building the platform for physical decision-making at Bricks. Taking on a few engagements a year.",
    images: ["/og.png"],
  },
  other: {
    "theme-color": "oklch(97% 0.008 85)",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
