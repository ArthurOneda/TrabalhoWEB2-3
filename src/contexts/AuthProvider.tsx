'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const publicRoutes = ['/', '/auth/login', '/auth/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (!currentUser && !publicRoutes.includes(pathname)) {
                router.push('/auth/login');
            } else if (currentUser && (pathname === '/auth/login' || pathname === '/auth/register')) {
                router.push('/dashboard');
            }
        });

        return () => unsubscribe();
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Carregando...</div>
            </div>
        );
    }

    return <>{children}</>;
}