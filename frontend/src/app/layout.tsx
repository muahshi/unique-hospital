import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unique Hospital Bhopal | Best Orthopedic & Multi-Specialty Clinic",
  description:
    "Unique Hospital in Bhopal, Madhya Pradesh — Expert orthopedic care, joint replacement, fracture management, and multi-specialty consultations. Book your appointment today.",
  keywords: [
    "Unique Hospital Bhopal",
    "orthopedic hospital Bhopal",
    "best hospital MP",
    "joint replacement Bhopal",
    "fracture treatment Bhopal",
    "spine surgery Bhopal",
    "orthopedic doctor Madhya Pradesh",
  ],
  openGraph: {
    title: "Unique Hospital Bhopal | Orthopedic & Multi-Specialty Care",
    description:
      "Expert orthopedic and multi-specialty healthcare in Bhopal, MP. Book appointments via WhatsApp instantly.",
    url: "https://uniquehospital.in",
    siteName: "Unique Hospital Bhopal",
    locale: "en_IN",
    type: "website",
  },
  manifest: "/manifest.json",
  themeColor: "#0a1628",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Hospital",
  name: "Unique Hospital",
  description:
    "Multi-specialty hospital in Bhopal with focus on orthopedic care, joint replacement and fracture management.",
  url: "https://uniquehospital.in",
  telephone: "+91-XXXXXXXXXX",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Your Street Address",
    addressLocality: "Bhopal",
    addressRegion: "Madhya Pradesh",
    postalCode: "462001",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "23.2599",
    longitude: "77.4126",
  },
  medicalSpecialty: [
    "Orthopedic Surgery",
    "Joint Replacement",
    "Spine Surgery",
    "Fracture Management",
  ],
  openingHours: "Mo-Sa 09:00-20:00",
  priceRange: "₹₹",
  hasMap: "https://maps.google.com/?q=Unique+Hospital+Bhopal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-dm-sans antialiased">{children}</body>
    </html>
  );
}
