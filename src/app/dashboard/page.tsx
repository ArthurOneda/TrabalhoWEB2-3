'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Task } from '@/types';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const q = query(
                    collection(db, 'tasks'),
                    where('userId', '==', auth.currentUser?.uid)
                );
                const querySnapshot = await getDocs(q);
                const tasksData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Task[];

                setTasks(tasksData);
            } catch (err) {
                console.error('Erro ao carregar tarefas:', err);
            } finally {
                setLoading(false);
            }
        };

        if (auth.currentUser) {
            fetchTasks();
        }
    }, []);

    const pendingTasks = tasks.filter(t => t.status !== 'done').length;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const completedThisWeek = tasks.filter(t =>
        t.status === 'done' && new Date(t.updatedAt) >= startOfWeek
    ).length;
    const overdueTasks = tasks.filter(t =>
        t.status !== 'done' && new Date(t.dueDate) < today
    ).length;

    const priorityCounts = {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
    };

    const barData = {
        labels: ['Baixa', 'Média', 'Alta'],
        datasets: [
            {
                label: 'Quantidade de Tarefas',
                data: [priorityCounts.low, priorityCounts.medium, priorityCounts.high],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(234, 179, 8, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: { mode: 'index' as const, intersect: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
            },
        },
    };

    const statusCounts = {
        todo: tasks.filter(t => t.status === 'todo').length,
        doing: tasks.filter(t => t.status === 'doing').length,
        done: tasks.filter(t => t.status === 'done').length,
    };

    const doughnutData = {
        labels: ['A Fazer', 'Fazendo', 'Concluído'],
        datasets: [
            {
                data: [statusCounts.todo, statusCounts.doing, statusCounts.done],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                ],
                borderWidth: 2,
                borderColor: '#fff',
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' as const },
        },
        cutout: '60%',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Carregando seu dashboard...</div>
            </div>
        );
    }

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (err) {
            console.error('Erro ao sair:', err);
            alert('Erro ao encerrar sessão.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">TaskFlow</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Bem-vindo!</p>
                            <p className="text-sm font-medium">{auth.currentUser?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                            aria-label="Sair da conta"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Visão Geral</h2>

                {/* Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <MetricCard title="Tarefas Pendentes" value={pendingTasks} color="bg-blue-100 text-blue-800" />
                    <MetricCard title="Concluídas esta semana" value={completedThisWeek} color="bg-green-100 text-green-800" />
                    <MetricCard title="Tarefas Vencidas" value={overdueTasks} color="bg-red-100 text-red-800" />
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Gráfico de Barras - Prioridades */}
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="font-semibold text-gray-800 mb-4">Tarefas por Prioridade</h3>
                        <div className="h-64">
                            <Bar data={barData} options={barOptions} />
                        </div>
                    </div>

                    {/* Gráfico de Doughnut - Status */}
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="font-semibold text-gray-800 mb-4">Status das Tarefas</h3>
                        <div className="h-64">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                        </div>
                    </div>
                </div>

                {/* Ações Rápidas */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Acesso Rápido</h3>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/tasks"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Ver Todas as Tarefas
                        </Link>
                        <Link
                            href="/kanban"
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Quadro Kanban
                        </Link>
                        <Link
                            href="/calendar"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            Calendário
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

function MetricCard({ title, value, color }: { title: string; value: number; color: string }) {
    return (
        <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${color.split(' ')[1]}`}>{value}</p>
        </div>
    );
}