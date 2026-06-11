import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Replay",
  description: "CLI replay engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className={`min-h-full flex flex-col ${geistMono.className}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}