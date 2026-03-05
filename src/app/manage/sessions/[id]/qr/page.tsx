"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api/attendanceApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import QRCode from "qrcode";

export default function QrCodePage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;
    const [qrSvg, setQrSvg] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState(30);

    const { data: tokenData, refetch, isFetching } = useQuery({
        queryKey: ["qrToken", sessionId],
        queryFn: () => attendanceApi.getQrToken(sessionId),
        refetchInterval: 30000,
    });

    useEffect(() => {
        if (tokenData?.qrToken) {
            QRCode.toString(tokenData.qrToken, { type: "svg", margin: 2, color: { dark: "#1A3C34", light: "#FFFFFF" } })
                .then(setQrSvg)
                .catch(console.error);
            setTimeLeft(30);
        }
    }, [tokenData]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-cream flex flex-col items-center animate-fade-in overflow-hidden">
            <div className="w-full px-6 pt-10 pb-4 flex justify-between items-center bg-cream/80 backdrop-blur z-20">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-white rounded-full shadow-soft hover:bg-forest/5 transition"
                >
                    <X size={24} className="text-forest" />
                </button>
                <span className="font-medium text-xs text-gray-500 tracking-[0.2em] font-sans uppercase">
                    Clave segura de sesión
                </span>
                <div className="w-12"></div>
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center px-6 sm:px-8 relative z-10">
                <div className="bg-white p-6 rounded-[3rem] shadow-float border border-forest/5 relative overflow-hidden animate-scale-in">
                    {/* Token value helper (small) */}
                    <div className="absolute top-6 left-6 z-20">
                        <Badge variant="secondary" className="bg-forest/5 border-transparent text-[8px] opacity-60">
                            TOKEN: {tokenData?.qrToken?.substring(0, 8)}...
                        </Badge>
                    </div>

                    <div
                        className="w-72 h-72 flex items-center justify-center p-2 bg-white"
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />

                    {/* Corner Markers */}
                    <div className="absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-forest rounded-tl-xl opacity-30"></div>
                    <div className="absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-forest rounded-tr-xl opacity-30"></div>
                    <div className="absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-forest rounded-bl-xl opacity-30"></div>
                    <div className="absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-forest rounded-br-xl opacity-30"></div>

                    {isFetching && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-30">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest"></div>
                        </div>
                    )}
                </div>

                {/* Timer UI */}
                <div className="mt-12 w-full max-w-xs px-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">
                        <span>Actualizando código</span>
                        <span className="text-forest font-serif italic text-sm">{timeLeft}s</span>
                    </div>
                    <div className="h-2 rounded-full bg-beige/50 overflow-hidden border border-forest/5 relative">
                        <div
                            className="h-full bg-forest/80 transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeLeft / 30) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-center text-gray-400 text-[10px] sm:text-xs mt-6 leading-relaxed font-medium">
                        Este código rota cada 30 segundos para evitar capturas no autorizadas.
                    </p>
                </div>
            </div>

            <div className="w-full px-6 pb-12 pt-6 flex justify-center bg-cream/80 backdrop-blur z-20">
                <Button
                    variant="secondary"
                    className="w-full max-w-sm h-16 shadow-soft"
                    onClick={() => router.back()}
                >
                    Volver a la sala
                </Button>
            </div>

            {/* Decorative Blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-forest/5 rounded-full blur-[100px] -z-10"></div>
        </div>
    );
}
