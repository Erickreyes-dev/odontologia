import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const defaultSiteUrl = "https://medisoftcore.com";

const siteUrl = (() => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  if (!envUrl) return defaultSiteUrl;
  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
})();

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MediSoftCore",
  description: "Plataforma de gestión odontológica todo en uno",
  applicationName: "MediSoftCore",
  keywords: [
    "software odontológico",
    "gestión dental",
    "agenda de citas",
    "historial clínico odontológico",
    "facturación clínica",
  ],
  authors: [{ name: "MediSoftCore" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/favicon.ico" }],
  },
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: "/",
    siteName: "MediSoftCore",
    title: "MediSoftCore | Plataforma de gestión odontológica",
    description: "Administra pacientes, citas, pagos e inventario desde una plataforma odontológica todo en uno.",
    images: [
      {
        url: "/favicon.ico",
        width: 512,
        height: 512,
        alt: "MediSoftCore",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "MediSoftCore | Plataforma de gestión odontológica",
    description: "Administra pacientes, citas, pagos e inventario desde una plataforma odontológica todo en uno.",
    images: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics/>
        <Toaster />
      </body>
    </html>
  );
}
