const DEFAULT_SITE_URL = "https://amatbookshelf.vercel.app"

function ensureProtocol(value: string): string {
    if (value.startsWith("http://") || value.startsWith("https://")) {
        return value
    }
    return `https://${value}`
}

export function getSiteUrl(): string {
    const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    const normalized = rawSiteUrl ? ensureProtocol(rawSiteUrl) : DEFAULT_SITE_URL
    return normalized.replace(/\/+$/, "")
}

export const CLUB_NAME = "El Librero de Amat"
export const CLUB_DESCRIPTION =
    "Club de lectura juvenil en Puno, Perú. Leemos, reflexionamos y crecemos en comunidad."
