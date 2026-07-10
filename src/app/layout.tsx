import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Bank Board Governance Hub",
    template: "%s | Bank Board Governance Hub",
  },
  description: "국내 은행 및 은행지주회사 이사회·사외이사 전문 지식 플랫폼",
  keywords: ["이사회", "사외이사", "지배구조", "내부통제", "금융규제", "거버넌스"],
  openGraph: {
    title: "Bank Board Governance Hub",
    description: "국내 은행 및 은행지주회사 이사회·사외이사 전문 지식 플랫폼",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${noto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
