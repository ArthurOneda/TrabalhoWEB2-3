'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { registerSchema } from '@/lib/validation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
    });

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        setError(null);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                name: data.name,
                email: data.email,
                createdAt: new Date().toISOString(),
            });

            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            let message = 'Erro ao criar conta.';
            if (err.code === 'auth/email-already-in-use') {
                message = 'Este e-mail já está cadastrado.';
            } else if (err.code === 'auth/invalid-email') {
                message = 'E-mail inválido.';
            } else if (err.code === 'auth/operation-not-allowed') {
                message = 'Cadastro desativado.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Nome */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Nome completo
                            </label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="Ex: Arthur Oneda"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        {/* E-mail */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail
                            </label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="seu@email.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Senha */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Senha
                            </label>
                            <Input
                                id="password"
                                type="password"
                                {...register('password')}
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirmar Senha */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar senha
                            </label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword')}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Botão de Cadastro */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Criando conta...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Criar Conta
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>
                            Já tem uma conta?{' '}
                            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}