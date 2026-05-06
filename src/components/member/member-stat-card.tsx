import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MemberStatCardProps {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    accent?: "forest" | "sage" | "ochre";
    className?: string;
}

const accentClasses: Record<NonNullable<MemberStatCardProps["accent"]>, string> = {
    forest: "text-forest bg-forest/8",
    sage: "text-sage bg-sage/10",
    ochre: "text-ochre bg-ochre/10",
};

export function MemberStatCard({
    label,
    value,
    hint,
    icon: Icon,
    accent = "forest",
    className,
}: MemberStatCardProps) {
    return (
        <Card
            className={cn(
                "rounded-[2rem] border border-forest/8 bg-white/90 p-5 backdrop-blur-sm",
                className
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-charcoal/45">
                        {label}
                    </p>
                    <p className="mt-5 font-serif text-4xl leading-none text-charcoal">{value}</p>
                    <p className="mt-3 text-sm leading-relaxed text-charcoal/65">{hint}</p>
                </div>
                <div
                    className={cn(
                        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        accentClasses[accent]
                    )}
                >
                    <Icon size={20} />
                </div>
            </div>
        </Card>
    );
}
