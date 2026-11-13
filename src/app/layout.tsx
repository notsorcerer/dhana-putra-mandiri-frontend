import type { Metadata, Viewport } from "next";
import { SvgSprites } from "@/components/app/svg-sprites";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CV Dhana Putra Mandiri — Sistem Distribusi Minyak Goreng",
    template: "%s · Dhana Putra Mandiri",
  },
  description:
    "Frontend sistem informasi distribusi minyak goreng CV Dhana Putra Mandiri: inventori, keuangan, SDM, dan laporan manajemen.",
};

export const viewport: Viewport = {
  themeColor: "#f7f8fa",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full">
        <SvgSprites />
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
