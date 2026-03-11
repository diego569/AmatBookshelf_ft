"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
    onScan: (token: string) => void;
    onClose: () => void;
}

/**
 * Classifica el error de la cámara para dar un mensaje útil al usuario
 * y evitar que todo error aparezca como "permiso denegado".
 */
function classifyError(err: unknown): string {
    if (!(err instanceof Error)) {
        return `Error desconocido: ${String(err)}`;
    }

    const name = err.name;
    const message = err.message.toLowerCase();

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        return "Permiso de cámara denegado. Ve a la configuración del navegador y habilita el acceso a la cámara.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        return "No se encontró ninguna cámara en este dispositivo.";
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
        return "La cámara está siendo usada por otra aplicación. Ciérrala y vuelve a intentar.";
    }
    if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
        return "No se pudo inicializar la cámara trasera. Intentando con la cámara disponible...";
    }
    if (name === "SecurityError") {
        return "El acceso a la cámara está bloqueado por seguridad. Asegúrate de estar en HTTPS.";
    }
    if (message.includes("could not start video source")) {
        return "No se pudo iniciar la cámara. Puede estar en uso por otra app.";
    }

    return `Error de cámara (${name}): ${err.message}`;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [flashlight, setFlashlight] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader();
        let cancelled = false;

        const startScanner = async () => {
            // ── 1. Verificar soporte de API ──────────────────────────────────
            if (!navigator.mediaDevices?.getUserMedia) {
                setErrorMessage("El acceso a la cámara no está disponible en este navegador. Usa Chrome o Safari actualizado.");
                setHasPermission(false);
                return;
            }

            // ── 2. Verificar que el videoRef ya está montado ─────────────────
            // En dispositivos lentos el ref puede no estar listo aún.
            if (!videoRef.current) {
                setErrorMessage("Error interno: el componente de video no está listo. Intenta de nuevo.");
                setHasPermission(false);
                return;
            }

            // ── 3. Solicitar permiso con constraints explícitas ──────────────
            // Usamos facingMode: environment para cámara trasera.
            // Esto es más compatible con Android que { video: true }.
            let permissionStream: MediaStream | null = null;
            try {
                permissionStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                });
            } catch (permErr) {
                if (cancelled) return;
                setErrorMessage(classifyError(permErr));
                setHasPermission(false);
                return;
            } finally {
                // Liberar el stream de prueba; zxing manejará el suyo propio
                permissionStream?.getTracks().forEach((t) => t.stop());
            }

            if (cancelled) return;

            // ── 4. Listar dispositivos de video ──────────────────────────────
            let videoInputDevices: MediaDeviceInfo[] = [];
            try {
                videoInputDevices = await codeReader.listVideoInputDevices();
            } catch (listErr) {
                if (cancelled) return;
                setDebugInfo(`listVideoInputDevices falló: ${String(listErr)}`);
                // Continuar con fallback por facingMode
            }

            if (cancelled) return;

            // ── 5. Seleccionar la cámara trasera de forma robusta ────────────
            // En Android los labels pueden estar vacíos o en otro idioma.
            // Intentamos buscar por label y como fallback usamos el índice.
            const backCameraKeywords = ["back", "trasera", "posterior", "rear", "environment", "0"];
            const backCamera = videoInputDevices.find((d) =>
                backCameraKeywords.some((kw) => d.label.toLowerCase().includes(kw))
            );
            const selectedDeviceId = backCamera?.deviceId ?? videoInputDevices[0]?.deviceId ?? null;

            setDebugInfo(
                `Dispositivos: ${videoInputDevices.length} | Seleccionado: ${backCamera?.label ?? "fallback"}`
            );

            // ── 6. Iniciar el decodificador ──────────────────────────────────
            // Estrategia: primero intenta con deviceId, si falla usa facingMode nativo.
            try {
                await codeReader.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current,
                    (result, err) => {
                        if (result) {
                            onScanRef.current(result.getText());
                            codeReader.reset();
                        }
                        // NotFoundException es normal (sin QR en cuadro), ignorar
                        if (err && !(err instanceof NotFoundException)) {
                            console.warn("[QrScanner] decode error:", err);
                        }
                    }
                );
                if (!cancelled) {
                    setHasPermission(true);
                    setErrorMessage(null);
                }
            } catch (decodeErr) {
                if (cancelled) return;
                console.error("[QrScanner] decodeFromVideoDevice failed, trying fallback:", decodeErr);

                // ── 6b. Fallback: dejar que el navegador elija la cámara ─────
                try {
                    await codeReader.decodeFromConstraints(
                        { video: { facingMode: { ideal: "environment" } } },
                        videoRef.current!,
                        (result, err) => {
                            if (result) {
                                onScanRef.current(result.getText());
                                codeReader.reset();
                            }
                            if (err && !(err instanceof NotFoundException)) {
                                console.warn("[QrScanner] fallback decode error:", err);
                            }
                        }
                    );
                    if (!cancelled) {
                        setHasPermission(true);
                        setErrorMessage(null);
                    }
                } catch (fallbackErr) {
                    if (cancelled) return;
                    console.error("[QrScanner] fallback also failed:", fallbackErr);
                    setErrorMessage(classifyError(fallbackErr));
                    setHasPermission(false);
                }
            }
        };

        startScanner();

        return () => {
            cancelled = true;
            codeReader.reset();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
            {/* Top Header */}
            <div className="relative z-10 px-6 sm:px-8 pt-10 pb-4 flex justify-between items-center text-white">
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 rounded-full backdrop-blur-md"
                    aria-label="Close scanner"
                >
                    <X size={22} />
                </button>
                <span className="font-medium tracking-wide text-sm opacity-90">Escanear código</span>
                <button
                    onClick={() => setFlashlight(!flashlight)}
                    className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                        flashlight ? "bg-yellow-400 text-black" : "bg-white/10 text-white"
                    }`}
                    aria-label="Toggle flashlight"
                >
                    <Zap size={22} fill={flashlight ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Camera Preview Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {hasPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white z-20 gap-3">
                        <p className="text-sm leading-relaxed">
                            {errorMessage ?? "Permiso de cámara denegado o no disponible."}
                        </p>
                        {debugInfo && (
                            <p className="text-xs text-white/40 mt-1">{debugInfo}</p>
                        )}
                    </div>
                )}

                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                />

                {/* Scanner Overlay */}
                <div
                    className="absolute inset-0 bg-black/40 z-10"
                    style={{
                        background:
                            "radial-gradient(circle at center, transparent 150px, rgba(0,0,0,0.86) 151px)",
                    }}
                />

                {/* Framing Box */}
                <div className="relative w-64 h-64 border border-white/20 rounded-3xl z-20">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sage rounded-tl-lg -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sage rounded-tr-lg -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sage rounded-bl-lg -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sage rounded-br-lg -mb-1 -mr-1" />

                    <div className="absolute left-0 right-0 h-0.5 bg-sage/80 shadow-[0_0_15px_rgba(74,108,76,0.8)] animate-pulse top-1/2" />
                </div>

                <p className="absolute bottom-20 text-white/70 text-sm font-medium tracking-wide animate-pulse z-20">
                    Alinea el código dentro del marco
                </p>
            </div>

            <div className="px-6 sm:px-8 pb-10 pt-6 bg-black">
                <Button variant="black" onClick={onClose} className="w-full h-14 rounded-xl font-bold">
                    Cancelar
                </Button>
            </div>
        </div>
    );
}
