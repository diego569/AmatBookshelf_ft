"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { BookMarked, BookOpenText, History, House, LibraryBig, ScrollText, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useManageReaderContext } from "@/lib/navigation/useManageReaderContext";

type ReaderSection = "home" | "sessions" | "history" | "passport" | "rank" | "ledger";

interface ReaderShellProps {
    active: ReaderSection;
    cycleId?: string | null;
    cycleName?: string | null;
    clubName?: string | null;
    title: string;
    subtitle?: string;
    badge?: string;
    headerAction?: ReactNode;
    children: ReactNode;
}

const sections = [
    { key: "home", label: "Inicio", icon: House },
    { key: "sessions", label: "Sesiones", icon: BookOpenText },
    { key: "history", label: "Historial", icon: History },
    { key: "passport", label: "Pasaporte", icon: BookMarked },
    { key: "rank", label: "Ranking", icon: Trophy },
] as const;

function getSectionHref(section: (typeof sections)[number]["key"], cycleId?: string | null) {
    switch (section) {
        case "home":
            return cycleId ? `/m/cycles/${cycleId}` : "/m";
        case "sessions":
            return cycleId ? `/m/cycles/${cycleId}/sessions` : "/m";
        case "history":
            return "/m/history";
        case "passport":
            return cycleId ? `/m/cycles/${cycleId}` : "/m";
        case "rank":
            return cycleId ? `/m/cycles/${cycleId}/rank` : "/m/rank";
        default:
            return "/m";
    }
}

export function ReaderShell({
    active,
    cycleId,
    cycleName,
    clubName,
    title,
    subtitle,
    badge,
    headerAction,
    children,
}: ReaderShellProps) {
    const { manageReturnHref, withManageContext } = useManageReaderContext(cycleId);

    return (
        <div className="min-h-screen bg-[#f7f2e8] text-charcoal">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_transparent_38%),linear-gradient(180deg,rgba(246,241,234,0.95),rgba(247,242,232,1))]" />
            <div className="pointer-events-none fixed inset-0 opacity-40 mix-blend-multiply [background-image:radial-gradient(rgba(26,60,52,0.16)_0.6px,transparent_0.6px)] [background-size:18px_18px]" />

            <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
                <aside className="hidden w-[280px] shrink-0 border-r border-forest/8 bg-white/70 px-6 py-8 backdrop-blur-xl lg:flex lg:flex-col">
                    <div>
                        <p className="max-w-[10ch] font-serif text-[2.1rem] italic leading-[0.92] text-forest">
                            Pasaporte del Club
                        </p>
                        <p className="mt-6 text-sm leading-relaxed text-charcoal/55">
                            {clubName || "Un lugar para leer, conversar y volver a encontrarnos."}
                        </p>
                    </div>

                    {cycleName ? (
                        <div className="mt-7 rounded-[1.75rem] border border-sage/15 bg-[#ecf7ee] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sage/80">
                                Ciclo visible
                            </p>
                            <p className="mt-2 text-lg font-semibold text-forest">{cycleName}</p>
                        </div>
                    ) : null}

                    <nav className="mt-10 space-y-2">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            const isActive = active === section.key;
                            const href = getSectionHref(section.key, cycleId);

                            return (
                                <Link
                                    key={section.key}
                                    href={withManageContext(href)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                                        isActive
                                            ? "bg-forest text-white shadow-lg shadow-forest/20"
                                            : "text-charcoal/68 hover:bg-forest/5 hover:text-forest"
                                    )}
                                >
                                    <Icon size={18} />
                                    {section.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto rounded-[1.75rem] border border-forest/8 bg-white/85 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                            Vista del lector
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                            Pensada para sentirse como app en celular y mantenerse clara tambien en web.
                        </p>
                        <Link
                            href={withManageContext(cycleId ? `/m/cycles/${cycleId}` : "/m")}
                            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-beige px-4 py-2 text-sm font-medium text-forest transition hover:bg-beige/80"
                        >
                            <LibraryBig size={16} />
                            Volver al ciclo
                        </Link>
                        <Link
                            href={withManageContext(cycleId ? `/m/cycles/${cycleId}/ledger` : "/m/ledger")}
                            className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-forest/10 px-4 py-2 text-sm font-medium text-charcoal/75 transition hover:border-forest/20 hover:text-forest"
                        >
                            <ScrollText size={16} />
                            Registro de puntos
                        </Link>
                        {manageReturnHref ? (
                            <Link
                                href={manageReturnHref}
                                className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-sage/15 bg-[#ecf7ee] px-4 py-2 text-sm font-medium text-forest transition hover:border-sage/25 hover:bg-[#e6f3e8]"
                            >
                                <LibraryBig size={16} />
                                Volver a gestión
                            </Link>
                        ) : null}
                    </div>
                </aside>

                <div className="relative flex-1 pb-24 lg:pb-10">
                    <header className="sticky top-0 z-30 border-b border-forest/8 bg-[#f7f2e8]/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:border-b-0 lg:bg-transparent lg:px-10 lg:py-8">
                        <div className="mx-auto flex max-w-[1200px] items-start justify-between gap-4">
                            <div className="min-w-0">
                                {badge ? (
                                    <div className="inline-flex rounded-full bg-[#e8f7ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sage">
                                        {badge}
                                    </div>
                                ) : null}
                                <h1 className="mt-3 text-balance font-serif text-[2.35rem] leading-[0.92] text-charcoal sm:text-[3.4rem]">
                                    {title}
                                </h1>
                                {subtitle ? (
                                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-charcoal/62 sm:text-base">
                                        {subtitle}
                                    </p>
                                ) : null}
                            </div>
                            {manageReturnHref || headerAction ? (
                                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                                    {manageReturnHref ? (
                                        <Link
                                            href={manageReturnHref}
                                            className="inline-flex h-10 items-center rounded-full border border-sage/15 bg-[#ecf7ee] px-4 text-sm font-medium text-forest transition hover:border-sage/25 hover:bg-[#e6f3e8]"
                                        >
                                            Volver a gestión
                                        </Link>
                                    ) : null}
                                    {headerAction}
                                </div>
                            ) : null}
                        </div>
                    </header>

                    <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10 lg:py-2">
                        {children}
                    </main>
                </div>
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/8 bg-white/92 px-2 py-2 backdrop-blur-xl lg:hidden">
                <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const isActive = active === section.key;
                        const href = getSectionHref(section.key, cycleId);

                        return (
                            <Link
                                key={section.key}
                                href={withManageContext(href)}
                                className={cn(
                                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                                    isActive ? "bg-forest text-white" : "text-charcoal/55 hover:bg-forest/5"
                                )}
                            >
                                <Icon size={18} />
                                <span className="truncate">{section.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
