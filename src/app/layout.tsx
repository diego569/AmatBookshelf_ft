import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CLUB_DESCRIPTION, CLUB_NAME, getSiteUrl } from "@/lib/seo";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
});

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: CLUB_NAME,
        template: `%s | ${CLUB_NAME}`,
    },
    description: CLUB_DESCRIPTION,
    keywords: [
        "club de lectura juvenil",
        "club de lectura en Puno",
        "club de lectura Perú",
        "lectura juvenil",
        "comunidad lectora",
        "El Librero de Amat",
    ],
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "es_PE",
        url: siteUrl,
        siteName: CLUB_NAME,
        title: CLUB_NAME,
        description: CLUB_DESCRIPTION,
    },
    twitter: {
        card: "summary_large_image",
        title: CLUB_NAME,
        description: CLUB_DESCRIPTION,
    },
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
};

import Providers from "@/providers";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`${inter.variable} ${playfair.variable} font-sans`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
