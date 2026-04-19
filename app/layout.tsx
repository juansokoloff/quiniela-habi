import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import PWAPrompt from "@/components/PWAPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiniela Habi - Mundial 2026",
  description: "Quiniela oficial de Tuhabi para el Mundial 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        {/* Sets .dark on <html> before paint to avoid theme flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-gray-50 dark:bg-[#0a0f0d] text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          {children}
          <PWAPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
