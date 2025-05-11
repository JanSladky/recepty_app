import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aplikace na recepty",
  description: "Vyhledávej, ukládej a tvoř vlastní recepty",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-900`}
      >
        <nav className="bg-white shadow p-4 flex gap-6">
          <Link href="/" className="hover:underline">Domů</Link>
          <Link href="/recepty" className="hover:underline">Recepty</Link>
          <Link href="/pridat-recept">Přidat recept</Link>
        </nav>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}