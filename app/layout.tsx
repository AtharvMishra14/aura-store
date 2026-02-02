import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prism Store - AI Powered App Market",
  description: "The safest place to discover apps, audited by Gemini AI.",
  icons: {
    icon: "/app-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Only children here. No <nav> or <header> tags! */}
        {children}
      </body>
    </html>
  );
}