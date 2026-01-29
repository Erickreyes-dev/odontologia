import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import ResetPassword from './components/form';

export default async function Page() {
    return (
        <Card className="w-full max-w-md mx-auto bg-gray-800 text-white border-gray-700 shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Cambio de contraseña</CardTitle>
                <CardDescription className="text-center text-gray-400">
                    Ingrese su nueva contraseña
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div className="text-center text-gray-400">Cargando…</div>}>
                    <ResetPassword />
                </Suspense>
            </CardContent>
        </Card>
    );
};
