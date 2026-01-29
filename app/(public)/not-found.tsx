import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <FileQuestion className="h-32 w-32 text-muted-foreground" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">404</h1>
                <h2 className="text-2xl font-semibold tracking-tight">Página o elemento no encontrado</h2>
                <p className="text-muted-foreground">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                </p>
                <div className="pt-4">
                    <Button asChild>
                        <Link href="/">
                            Volver al inicio
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
} 