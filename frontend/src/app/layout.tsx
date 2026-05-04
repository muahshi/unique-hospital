import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unique Hospital Bhopal | Best Orthopedic Hospital in MP",
  description:
    "Unique Hospital Bhopal — Expert orthopedic care, joint replacement, arthroscopy, fracture management & emergency trauma. Located at Kohefiza, Bhopal. Call: 919575877759",
  keywords: [
    "Unique Hospital Bhopal",
    "orthopedic hospital Bhopal",
    "joint replacement Bhopal",
    "arthroscopy Bhopal",
    "best hospital Kohefiza",
    "orthopedic surgeon Madhya Pradesh",
    "fracture treatment Bhopal",
  ],
  openGraph: {
    title: "Unique Hospital Bhopal | Orthopedic Excellence",
    description: "Expert orthopedic & multi-specialty care in Bhopal, MP.",
    url: "https://unique-hospital-bice.vercel.app",
    siteName: "Unique Hospital Bhopal",
    locale: "en_IN",
    type: "website",
  },
  manifest: "/manifest.json",
  themeColor: "#0A5C96",
  viewport: { width: "device-width", initialScale: 1, maximumScale: 1 },
  icons: { apple: "/icons/icon-192x192.png" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Hospital",
  name: "Unique Hospital",
  url: "https://unique-hospital-bice.vercel.app",
  telephone: "+91-9575877759",
  address: {
    "@type": "PostalAddress",
    streetAddress: "77, Motia Talab Rd, Kohefiza",
    addressLocality: "Bhopal",
    addressRegion: "Madhya Pradesh",
    postalCode: "462001",
    addressCountry: "IN",
  },
  geo: { "@type": "GeoCoordinates", latitude: "23.2599", longitude: "77.4126" },
  medicalSpecialty: ["Orthopedic Surgery", "Joint Replacement", "Arthroscopy", "Spine Surgery"],
  openingHours: "Mo-Sa 09:00-20:00",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Unique Hospital" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
          }}
        />
      </body>
    </html>
  );
}
