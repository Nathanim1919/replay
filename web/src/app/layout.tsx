import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'sonner';

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
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col font-sans bg-[#09090b]">
        <Toaster />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}