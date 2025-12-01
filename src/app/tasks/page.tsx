'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Task, Subtask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { safeFormatDate } from '@/lib/utils';

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium' as const,
    });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser?.uid));
                const snapshot = await getDocs(q);
                const tasksData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Task[];
                setTasks(tasksData);
            } catch (err) {
                console.error(err);
                setError('Erro ao carregar tarefas');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const newTaskDoc = {
                userId: auth.currentUser!.uid,
                title: newTask.title.trim(),
                description: newTask.description.trim(),
                dueDate: newTask.dueDate,
                priority: newTask.priority,
                status: 'todo' as const,
                subtasks: [] as Subtask[],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'tasks'), newTaskDoc);

            const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser?.uid));
            const snapshot = await getDocs(q);
            const tasksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Task[];
            setTasks(tasksData);

            setNewTask({ title: '', description: '', dueDate: '', priority: 'medium' });
        } catch (err) {
            console.error(err);
            setError('Erro ao criar tarefa');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

        try {
            await deleteDoc(doc(db, 'tasks', taskId));
            setTasks(tasks.filter(task => task.id !== taskId));
        } catch (err) {
            alert('Erro ao excluir tarefa');
        }
    };

    const calculateProgress = (subtasks: Subtask[]): number => {
        if (subtasks.length === 0) return 0;
        const completed = subtasks.filter(s => s.completed).length;
        return Math.round((completed / subtasks.length) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Carregando tarefas...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">Minhas Tarefas</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">
                        ← Voltar ao Dashboard
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Formulário para Nova Tarefa */}
                <Card className="mb-8 p-6">
                    <h2 className="text-xl font-semibold mb-4">Criar Nova Tarefa</h2>
                    {error && <p className="text-red-600 mb-4">{error}</p>}
                    <form onSubmit={handleCreateTask} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                            <Input
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                placeholder="Ex: Finalizar relatório"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Detalhes da tarefa..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento *</label>
                                <Input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade *</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? 'Criando...' : 'Criar Tarefa'}
                        </button>
                    </form>
                </Card>

                {/* Lista de Tarefas */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Tarefas ({tasks.length})</h2>

                    {tasks.length === 0 ? (
                        <p className="text-gray-500">Nenhuma tarefa encontrada. Crie uma nova!</p>
                    ) : (
                        <div className="space-y-4">
                            {tasks.map((task) => {
                                const progress = calculateProgress(task.subtasks);
                                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

                                return (
                                    <Card key={task.id} className={`p-4 ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
                                        <div className="flex justify-between">
                                            <h3 className="font-semibold text-lg">{task.title}</h3>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/tasks/${task.id}`}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Ver detalhes
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-red-600 hover:underline text-sm"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>

                                        {task.description && <p className="text-gray-600 text-sm mt-1">{task.description}</p>}

                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                            <span>Vencimento: {safeFormatDate(task.dueDate)}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                            </span>
                                            <span>Status: {task.status === 'todo' ? 'A Fazer' : task.status === 'doing' ? 'Fazendo' : 'Concluído'}</span>
                                        </div>

                                        {/* Barra de Progresso */}
                                        {task.subtasks.length > 0 && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Progresso ({progress}%)</span>
                                                    <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${progress === 100 ? 'bg-green-500' :
                                                                progress > 50 ? 'bg-blue-500' : 'bg-amber-500'
                                                            }`}
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}