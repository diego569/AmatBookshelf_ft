import Link from "next/link";

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-5xl text-forest mb-4">El Librero de Amat</h1>
            <p className="text-xl text-charcoal/60 mb-8 italic">"Lee. Reflexiona. Pertenece."</p>
            <div className="flex gap-4">
                <Link
                    href="/m/login"
                    className="bg-forest text-white px-6 py-3 rounded-2xl font-medium shadow-soft hover:bg-[#15322b] transition"
                >
                    Acceso de miembros
                </Link>
                <Link
                    href="/manage"
                    className="bg-white text-forest border border-forest/10 px-6 py-3 rounded-2xl font-medium shadow-soft hover:bg-forest/5 transition"
                >
                    Acceso de administración
                </Link>
            </div>
        </main>
    );
}
