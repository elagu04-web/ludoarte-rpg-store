import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Retro 8-bit pixel font for the start screen (menu options, ticker text) --
// self-hosted at build time by next/font, no runtime request to Google.
const pressStart2P = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

const SITE_DESCRIPTION =
  "Ludoarte, tu ludoteca en Epico Atlantida, ahora en un mini-RPG: recorre la tienda, compra, alquila o pedi juegos de mesa desde el celular o la compu.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ludoarte-rpg-store.vercel.app"),
  title: "Ludoarte RPG Store",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "Ludoarte RPG Store",
    description: SITE_DESCRIPTION,
    images: ["/assets/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ludoarte RPG Store",
    description: SITE_DESCRIPTION,
    images: ["/assets/logo.png"],
  },
  // iOS Safari has no Fullscreen API a page can call -- the only way to
  // get rid of its address bar there is if the user adds this page to
  // their Home Screen; these tags make that launch without any Safari
  // chrome at all, like a real app icon.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ludoarte",
  },
};

// Without this, mobile Safari renders the page at a fake ~980px desktop
// width and zooms it out to fit -- which breaks touch coordinates, makes
// every max-width media query see the wrong number, and was the real
// cause of the blank/unresponsive screen on iPhone.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
