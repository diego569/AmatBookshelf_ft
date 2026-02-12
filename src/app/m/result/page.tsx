"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/confetti";
import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScanResultPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const ok = searchParams.get("ok") === "true";
    const status = searchParams.get("status");
    const points = searchParams.get("points") || "0";
    const message = searchParams.get("message") || "Something went wrong";

    const isLate = status === "LATE";
    const isErr = !ok || status === "ERROR";

    const config = isErr
        ? {
            badge: "SCAN FAILED",
            icon: <X size={44} />,
            iconBg: "bg-red/10",
            iconColor: "text-red",
            title: "Invalid QR",
            subtitle: message,
            points: "0",
            pointsColor: "text-red",
            showConfetti: false,
        }
        : isLate
            ? {
                badge: "LATE ARRIVAL",
                icon: <Clock size={44} />,
                iconBg: "bg-ochre/10",
                iconColor: "text-ochre",
                title: "Checked In",
                subtitle: "Better late than never!",
                points: `+${points}`,
                pointsColor: "text-ochre",
                showConfetti: false,
            }
            : {
                badge: "ON TIME",
                icon: <Check size={44} />,
                iconBg: "bg-sage/10",
                iconColor: "text-sage",
                title: "Attendance Confirmed!",
                subtitle: "You are on time.",
                points: `+${points}`,
                pointsColor: "text-sage",
                showConfetti: true,
            };

    return (
        <div className="fixed inset-0 z-50 bg-cream flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-md animate-scale-in relative">
                {config.showConfetti && <Confetti />}

                <Card className="p-8 text-center flex flex-col items-center relative z-10 bg-white">
                    <div
                        className={cn(
                            "w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner",
                            config.iconBg,
                            config.iconColor
                        )}
                    >
                        {config.icon}
                    </div>

                    <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold tracking-widest rounded-full mb-4">
                        {config.badge}
                    </span>

                    <h2 className="font-serif text-3xl text-forest mb-2">{config.title}</h2>
                    <p className="text-gray-500 mb-7">{config.subtitle}</p>

                    <div className="w-full bg-cream rounded-2xl p-4 border border-beige mb-7">
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">
                            Points Earned
                        </span>
                        <div
                            className={cn(
                                "font-serif text-5xl font-bold mt-1",
                                config.pointsColor
                            )}
                        >
                            {config.points}
                        </div>
                    </div>

                    <Button onClick={() => router.push("/m")} className="w-full h-14">
                        Done
                    </Button>
                </Card>
            </div>
        </div>
    );
}
