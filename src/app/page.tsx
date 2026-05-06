import type { Metadata } from "next"
import Link from "next/link"
import { Award, BookOpen, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { CLUB_DESCRIPTION, CLUB_NAME, getSiteUrl } from "@/lib/seo"

const siteUrl = getSiteUrl()
const heroImage = `${siteUrl}/images/landing/hero-session.jpg`

export const metadata: Metadata = {
    title: "Club de lectura juvenil en Puno, Perú",
    description: CLUB_DESCRIPTION,
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: CLUB_NAME,
        description: CLUB_DESCRIPTION,
        url: siteUrl,
        images: [
            {
                url: heroImage,
                width: 1200,
                height: 900,
                alt: "Sesión de lectura en comunidad - El Librero de Amat",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: CLUB_NAME,
        description: CLUB_DESCRIPTION,
        images: [heroImage],
    },
}

const experienceCards = [
    {
        title: "Conexión",
        description: "Conecta con lectoras y lectores locales que comparten tu ritmo de lectura.",
        icon: Users,
    },
    {
        title: "Reflexión",
        description: "Profundiza en conversaciones guiadas que enriquecen cada capítulo.",
        icon: BookOpen,
    },
    {
        title: "Gamificación",
        description: "Gana puntos y recompensas por tu constancia en cada sesión.",
        icon: Award,
    },
]

const galleryImages = [
    {
        src: "/images/landing/sesion-principal.png",
        alt: "Sesion principal del club de lectura",
        className: "md:col-span-2 md:row-span-2 h-[320px] md:h-[520px]",
    },
    {
        src: "/images/landing/lectura-compartida.jpg",
        alt: "Integrantes leyendo en comunidad",
        className: "h-[220px] md:h-[250px]",
    },
    {
        src: "/images/landing/dialogo-circulo.png",
        alt: "Dialogo en circulo durante la sesion",
        className: "h-[220px] md:h-[250px]",
    },
    {
        src: "/images/landing/momentos-reflexion.jpg",
        alt: "Momentos de reflexion del grupo",
        className: "h-[220px] md:col-span-2 md:h-[250px]",
    },
]

export default function Home() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${siteUrl}/#organization`,
                name: CLUB_NAME,
                url: siteUrl,
                description: CLUB_DESCRIPTION,
                areaServed: "Puno, Perú",
                address: {
                    "@type": "PostalAddress",
                    addressLocality: "Puno",
                    addressCountry: "PE",
                },
            },
            {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                url: siteUrl,
                name: CLUB_NAME,
                inLanguage: "es-PE",
                publisher: {
                    "@id": `${siteUrl}/#organization`,
                },
            },
        ],
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2E4035]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:px-8 lg:pb-20 lg:pt-16">
                <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                    <div className="space-y-6">
                        <p className="text-sm uppercase tracking-[0.24em] text-[#2E4035]/65">
                            Intranet del club de lectura
                        </p>
                        <h1 className="font-serif text-5xl leading-[0.95] text-[#2E4035] md:text-6xl lg:text-7xl">
                            El Librero de Amat
                        </h1>
                        <p className="font-serif text-xl italic text-[#2E4035]/75 md:text-2xl">
                            Lee. Reflexiona. Pertenece.
                        </p>
                        <p className="max-w-xl text-base leading-relaxed text-charcoal/75 md:text-lg">
                            Un espacio donde la lectura se convierte en encuentro, la palabra en
                            conversación y cada sesión en una experiencia compartida.
                        </p>
                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <Button
                                asChild
                                className="h-12 rounded-2xl bg-[#2E4035] px-6 text-base font-semibold hover:bg-[#25362c]"
                            >
                                <Link href="/m/login">Acceso al intranet</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-[#2E4035]/10 blur-2xl" />
                        <img
                            src="/images/landing/hero-session.jpg"
                            alt="Grupo de lectura reunido"
                            width={800}
                            height={600}
                            className="h-full w-full rounded-2xl border border-[#2E4035]/10 object-cover shadow-float"
                        />
                    </div>
                </section>

                <section className="mt-16 rounded-[2rem] bg-[#EFE8DC] px-6 py-12 md:mt-20 md:px-8 md:py-14">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-3xl text-[#2E4035] md:text-4xl">
                            Más que un club, una comunidad.
                        </h2>
                        <p className="mt-3 text-base text-charcoal/75 md:text-lg">
                            Diseñado para acompañar tu camino lector con vínculos reales y
                            conversaciones con propósito.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-3">
                        {experienceCards.map((item) => {
                            const Icon = item.icon
                            return (
                                <Card
                                    key={item.title}
                                    className="rounded-2xl border-[#2E4035]/10 bg-[#FDFBF7] shadow-soft"
                                >
                                    <CardHeader className="pb-2">
                                        <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2E4035]/10 text-[#2E4035]">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <CardTitle className="text-2xl text-[#2E4035]">
                                            {item.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-sm leading-relaxed text-charcoal/75 md:text-base">
                                            {item.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </section>

                <section className="mt-16 md:mt-20">
                    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-3xl text-[#2E4035] md:text-4xl">Nuestras Sesiones</h2>
                            <p className="mt-2 text-base text-charcoal/75 md:text-lg">
                                Instantes del club para reemplazar luego con tus fotografías reales.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-3">
                        {galleryImages.map((image) => (
                            <div key={image.src} className={image.className}>
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="h-full w-full rounded-2xl border border-[#2E4035]/10 object-cover shadow-soft"
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <footer className="border-t border-[#2E4035]/15 bg-[#F6F1E8]">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-charcoal/80 md:flex-row md:items-center md:justify-between md:px-8">
                    <p className="font-medium text-[#2E4035]">El Librero de Amat</p>
                    <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
                </div>
            </footer>
        </main>
    )
}
