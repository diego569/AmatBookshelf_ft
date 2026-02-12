"use client";

import { useMemo } from "react";

export function Confetti() {
    const pieces = useMemo(() => {
        const arr = [];
        const colors = ["#4A6C4C", "#D4A373", "#1A3C34", "#EBE5DA"];
        for (let i = 0; i < 20; i++) {
            arr.push({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                duration: 1.5 + Math.random() * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }
        return arr;
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
            {pieces.map((p) => (
                <div
                    key={p.id}
                    className="absolute w-2 h-3 rounded-sm opacity-90 animate-confetti-fall"
                    style={{
                        left: `${p.left}%`,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        top: "-20px",
                    }}
                />
            ))}
            <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: ease-in;
          animation-fill-mode: forwards;
        }
      `}</style>
        </div>
    );
}
