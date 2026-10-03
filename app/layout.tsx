import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { siteData } from "@/data/siteData";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0b0f19",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://vedatransport.in"),
  title: {
    default: `${siteData.company.name} | ${siteData.company.tagline}`,
    template: `%s | ${siteData.company.name}`,
  },
  description: siteData.company.description,
  keywords: [
    "Veda Transport",
    "Veda Transport Logistics",
    "Logistics Surat Gujarat",
    "Kamrej Transport Service",
    "Full Truck Load India",
    "Part Load Transport Gujarat",
    "Tempo service Surat",
    "Tata Ace booking Gujarat",
    "Packers and Movers Surat",
    "Express delivery logistics India",
    "Indian transport company",
    "Best transport company Gujarat",
  ],
  authors: [{ name: siteData.company.name }],
  creator: siteData.company.name,
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://vedatransport.in",
    title: `${siteData.company.name} - ${siteData.company.tagline}`,
    description: siteData.company.description,
    siteName: siteData.company.name,
    images: [
      {
        url: "/truck_logo.jpg",
        width: 1200,
        height: 630,
        alt: `${siteData.company.name} Transport Fleet`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteData.company.name} - ${siteData.company.tagline}`,
    description: siteData.company.description,
    images: ["/truck_logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CargoService",
    "name": siteData.company.name,
    "legalName": siteData.company.legalName,
    "description": siteData.company.description,
    "url": "https://vedatransport.in",
    "telephone": siteData.contact.phoneDial,
    "email": siteData.contact.email,
    "logo": "https://vedatransport.in/truck_logo.jpg",
    "taxID": siteData.company.gstNumber,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": `${siteData.address.line1}, ${siteData.address.line2}`,
      "addressLocality": siteData.address.city,
      "addressRegion": siteData.address.state,
      "postalCode": siteData.address.pincode,
      "addressCountry": "IN",
    },
    "areaServed": "IN",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Transport Services",
      "itemListElement": siteData.services.map((svc, idx) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": svc.title,
          "description": svc.description,
        },
        "position": idx + 1,
      })),
    },
  };

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full dark antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-primary text-white font-sans overflow-x-hidden">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
