"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
    onScan: (token: string) => void;
    onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [flashlight, setFlashlight] = useState(false);

    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader();

        const startScanner = async () => {
            try {
                const videoInputDevices = await codeReader.listVideoInputDevices();
                // Select back camera if available, otherwise first one
                const selectedDeviceId = videoInputDevices.find(device => device.label.toLowerCase().includes('back'))?.deviceId || videoInputDevices[0].deviceId;

                await codeReader.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current!,
                    (result, error) => {
                        if (result) {
                            onScanRef.current(result.getText());
                            codeReader.reset();
                        }
                    }
                );
                setHasPermission(true);
            } catch (err) {
                console.error("Scanner init error:", err);
                setHasPermission(false);
            }
        };

        startScanner();

        return () => {
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
                <span className="font-medium tracking-wide text-sm opacity-90">Scan Code</span>
                <button
                    onClick={() => setFlashlight(!flashlight)}
                    className={`p-2 rounded-full backdrop-blur-md transition-colors ${flashlight ? "bg-yellow-400 text-black" : "bg-white/10 text-white"
                        }`}
                    aria-label="Toggle flashlight"
                >
                    <Zap size={22} fill={flashlight ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Camera Preview Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {hasPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white z-20">
                        <p>Camera permission denied or not available. Please allow camera access to scan.</p>
                    </div>
                )}

                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Scanner Overlay Overlay */}
                <div className="absolute inset-0 bg-black/40 z-10"
                    style={{
                        background: "radial-gradient(circle at center, transparent 150px, rgba(0,0,0,0.86) 151px)"
                    }}>
                </div>

                {/* Framing Box */}
                <div className="relative w-64 h-64 border border-white/20 rounded-3xl z-20">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sage rounded-tl-lg -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sage rounded-tr-lg -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sage rounded-bl-lg -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sage rounded-br-lg -mb-1 -mr-1"></div>

                    <div className="absolute left-0 right-0 h-0.5 bg-sage/80 shadow-[0_0_15px_rgba(74,108,76,0.8)] animate-pulse top-1/2"></div>
                </div>

                <p className="absolute bottom-20 text-white/70 text-sm font-medium tracking-wide animate-pulse z-20">
                    Align code within frame
                </p>
            </div>

            <div className="px-6 sm:px-8 pb-10 pt-6 bg-black">
                <Button variant="black" onClick={onClose} className="w-full h-14 rounded-xl font-bold">
                    Cancel
                </Button>
            </div>
        </div>
    );
}
