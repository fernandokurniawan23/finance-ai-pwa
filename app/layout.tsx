import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. Metadata Aplikasi
export const metadata: Metadata = {
  title: "Finance AI",
  description: "Smart Finance Tracker powered by Llama 3",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192.png", // Icon untuk iPhone home screen
  },
};

// 2. Viewport & Theme Color
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 text-black antialiased`}>
        {children}
      </body>
    </html>
  );
}