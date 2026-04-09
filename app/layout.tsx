import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sam Anderson",
  description:
    "Head of Product at Bricks. Currently taking on a few AI consulting engagements.",
  metadataBase: new URL("https://sambanderson.com"),
  openGraph: {
    title: "Sam Anderson",
    description:
      "Head of Product at Bricks. Currently taking on a few AI consulting engagements.",
    images: ["/og.png"],
  },
  other: {
    "theme-color": "oklch(98.5% 0.005 80)",
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
