"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/auth";
import { authApi } from "@/lib/api/authApi";
import { toast } from "sonner";
import { Book, ChevronDown, ChevronUp } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const setTokens = useAuthStore((state) => state.setTokens);
    const [showDevLogin, setShowDevLogin] = useState(false);
    const [devAccessToken, setDevAccessToken] = useState("");
    const [devRefreshToken, setDevRefreshToken] = useState("");

    const handleGoogleLogin = () => {
        window.location.href = authApi.getGoogleAuthUrl();
    };

    const handleDevLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!devAccessToken || !devRefreshToken) {
            toast.error("Por favor ingresa ambos tokens");
            return;
        }
        setTokens(devAccessToken, devRefreshToken);
        toast.success("Sesión iniciada con tokens de desarrollo");
        router.push("/m");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-between p-7 sm:p-10 animate-fade-in relative overflow-hidden bg-cream">
            {/* soft blobs background decoration */}
            <div className="absolute top-[-12%] right-[-22%] w-72 h-72 rounded-full bg-beige opacity-50 blur-3xl -z-10"></div>
            <div className="absolute bottom-[-12%] left-[-22%] w-96 h-96 rounded-full bg-sage opacity-10 blur-3xl -z-10"></div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm text-center gap-10">
                <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-forest rounded-2xl flex items-center justify-center shadow-soft transform rotate-3">
                        <Book className="text-cream" size={30} />
                    </div>
                    <h1 className="font-serif text-5xl text-forest tracking-tight">Reúnete.</h1>
                </div>

                <div className="relative">
                    <div className="w-36 h-44 border-2 border-forest/20 rounded-r-2xl rounded-l-md bg-white shadow-soft flex items-center justify-center relative z-10">
                        <span className="font-serif text-forest/40 italic text-xl">Vol. I</span>
                    </div>
                    <div className="absolute top-1 left-1 w-36 h-44 border border-forest/10 rounded-r-2xl rounded-l-md bg-cream -z-0"></div>
                </div>

                <div className="space-y-2">
                    <p className="font-serif text-2xl italic text-charcoal">"Lee. Reflexiona. Pertenece."</p>
                    <p className="font-sans text-xs text-gray-500 uppercase tracking-[0.22em]">Acceso de miembros</p>
                </div>
            </div>

            <div className="w-full max-w-sm space-y-5 mb-6">
                <Button
                    onClick={handleGoogleLogin}
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-forest/30 text-charcoal font-medium py-4 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 h-auto text-base"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Ingresar con Google</span>
                </Button>

                {process.env.NEXT_PUBLIC_DEV_LOGIN === "1" && (
                    <div className="space-y-4 pt-4">
                        <button
                            onClick={() => setShowDevLogin(!showDevLogin)}
                            className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                        >
                            {showDevLogin ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Acceso Dev
                        </button>

                        {showDevLogin && (
                            <Card className="p-6 space-y-4 animate-slide-up h-auto bg-white/50 backdrop-blur-sm">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-wider">Token de acceso</label>
                                    <Input
                                        placeholder="eyJhbG..."
                                        value={devAccessToken}
                                        onChange={(e) => setDevAccessToken(e.target.value)}
                                        className="text-xs font-mono"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-wider">Token de actualización</label>
                                    <Input
                                        placeholder="eyJhbG..."
                                        value={devRefreshToken}
                                        onChange={(e) => setDevRefreshToken(e.target.value)}
                                        className="text-xs font-mono"
                                    />
                                </div>
                                <Button onClick={handleDevLogin} className="w-full h-12 text-sm">
                                    Ingresar como Dev
                                </Button>
                            </Card>
                        )}
                    </div>
                )}

                <p className="text-center text-[11px] text-gray-400 font-medium tracking-[0.2em] pt-4">
                    PRIMERO EN CELULAR • RESPONSIVO
                </p>
            </div>
        </div>
    );
}
