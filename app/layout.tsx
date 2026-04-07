import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getLocaleFromCookieStore } from "@/lib/i18n/settings";
import { AutoTranslateDOM } from "@/components/i18n/auto-translate-dom";


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
  description: "Plataforma de gestión clínica todo en uno",
  applicationName: "MediSoftCore",
  keywords: [
    "software clínico",
    "gestión de clínicas",
    "agenda de citas",
    "historial clínico",
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
    title: "MediSoftCore | Plataforma de gestión clínica",
    description: "Administra pacientes, citas, pagos e inventario desde una plataforma clínica todo en uno.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MediSoftCore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MediSoftCore | Plataforma de gestión clínica",
    description: "Administra pacientes, citas, pagos e inventario desde una plataforma clínica todo en uno.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocaleFromCookieStore();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider initialLocale={locale}>
          <AutoTranslateDOM />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Analytics/>
            <Toaster />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
