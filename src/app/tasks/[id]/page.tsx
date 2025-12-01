'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Task, Subtask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { safeFormatDate, safeFormatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function TaskDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        dueDate: string;
        priority: 'low' | 'medium' | 'high';
        status: 'todo' | 'doing' | 'done';
    }>({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        status: 'todo',
    });
    const [newSubtask, setNewSubtask] = useState('');
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<{ id: string; text: string; createdAt: string }[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const docRef = doc(db, 'tasks', id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const taskData = { id: docSnap.id, ...docSnap.data() } as Task;
                    setTask(taskData);
                    setFormData({
                        title: taskData.title,
                        description: taskData.description,
                        dueDate: taskData.dueDate.split('T')[0],
                        priority: taskData.priority,
                        status: taskData.status,
                    });

                    setComments([
                        { id: '1', text: 'Tarefa criada.', createdAt: taskData.createdAt },
                    ]);
                } else {
                    setError('Tarefa não encontrada.');
                }
            } catch (err) {
                console.error(err);
                setError('Erro ao carregar tarefa.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTask();
    }, [id]);

    const calculateProgress = (subtasks: Subtask[]): number => {
        if (subtasks.length === 0) return 0;
        const completed = subtasks.filter(s => s.completed).length;
        return Math.round((completed / subtasks.length) * 100);
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const taskRef = doc(db, 'tasks', id as string);
            await updateDoc(taskRef, {
                ...formData,
                dueDate: formData.dueDate,
                updatedAt: serverTimestamp(),
            });
            setTask(prev => prev ? { ...prev, ...formData } : null);
            setEditing(false);
        } catch (err) {
            alert('Erro ao salvar tarefa.');
        }
    };

    const toggleSubtask = async (subtaskId: string) => {
        if (!task) return;
        const updatedSubtasks = task.subtasks.map(sub =>
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        try {
            const taskRef = doc(db, 'tasks', id as string);
            await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
            setTask({ ...task, subtasks: updatedSubtasks });
        } catch (err) {
            alert('Erro ao atualizar sub-tarefa.');
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtask.trim() || !task) return;
        const newSub: Subtask = {
            id: Date.now().toString(),
            title: newSubtask.trim(),
            completed: false,
        };
        const updatedSubtasks = [...task.subtasks, newSub];
        try {
            const taskRef = doc(db, 'tasks', id as string);
            await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
            setTask({ ...task, subtasks: updatedSubtasks });
            setNewSubtask('');
        } catch (err) {
            alert('Erro ao adicionar sub-tarefa.');
        }
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        if (!task) return;
        const updatedSubtasks = task.subtasks.filter(sub => sub.id !== subtaskId);
        try {
            const taskRef = doc(db, 'tasks', id as string);
            await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
            setTask({ ...task, subtasks: updatedSubtasks });
        } catch (err) {
            alert('Erro ao excluir sub-tarefa.');
        }
    };

    const handleDeleteTask = async () => {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
        try {
            await deleteDoc(doc(db, 'tasks', id as string));
            router.push('/tasks');
        } catch (err) {
            alert('Erro ao excluir tarefa.');
        }
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment = {
            id: Date.now().toString(),
            text: newComment.trim(),
            createdAt: new Date().toISOString(),
        };
        setComments(prev => [comment, ...prev]);
        setNewComment('');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Carregando tarefa...</p>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">{error || 'Tarefa não encontrada.'}</p>
            </div>
        );
    }

    const progress = calculateProgress(task.subtasks);
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">Detalhes da Tarefa</h1>
                    <Link href="/tasks" className="text-blue-600 hover:underline">
                        ← Voltar
                    </Link>
                </div>
            </ header>

            <main className="container mx-auto px-4 py-8">
                {/* Título e Ações */}
                <div className="flex justify-between items-start mb-6">
                    {editing ? (
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                        />
                    ) : (
                        <h2 className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {task.title}
                        </h2>
                    )}
                    <div className="flex gap-2">
                        {editing ? (
                            <>
                                <button
                                    onClick={handleUpdateTask}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                    Salvar
                                </button>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                                >
                                    Cancelar
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={handleDeleteTask}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                >
                                    Excluir
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progresso */}
                {task.subtasks.length > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Progresso ({progress}%)</span>
                            <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full ${progress === 100 ? 'bg-green-500' :
                                    progress > 50 ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Detalhes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Informações principais */}
                    <Card className="p-5">
                        <h3 className="font-semibold mb-3">Detalhes</h3>
                        {editing ? (
                            <form onSubmit={handleUpdateTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Vencimento</label>
                                        <Input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Prioridade</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="low">Baixa</option>
                                            <option value="medium">Média</option>
                                            <option value="high">Alta</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="todo">A Fazer</option>
                                            <option value="doing">Fazendo</option>
                                            <option value="done">Concluído</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <p><span className="font-medium">Descrição:</span> {task.description || '—'}</p>
                                <p><span className="font-medium">Vencimento:</span> {safeFormatDate(task.dueDate)}</p>
                                <p><span className="font-medium">Prioridade:</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                        task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                    </span>
                                </p>
                                <p><span className="font-medium">Status:</span>
                                    {task.status === 'todo' ? 'A Fazer' : task.status === 'doing' ? 'Fazendo' : 'Concluído'}
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Sub-tarefas */}
                    <Card className="p-5">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold">Sub-tarefas</h3>
                            <span className="text-sm text-gray-500">{task.subtasks.length} itens</span>
                        </div>

                        <div className="space-y-2 mb-4">
                            {task.subtasks.length === 0 ? (
                                <p className="text-gray-500 text-sm">Nenhuma sub-tarefa.</p>
                            ) : (
                                task.subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={sub.completed}
                                            onChange={() => toggleSubtask(sub.id)}
                                            className="w-4 h-4"
                                        />
                                        <span className={`${sub.completed ? 'line-through text-gray-500' : ''}`}>
                                            {sub.title}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSubtask(sub.id)}
                                            className="text-red-500 hover:text-red-700 text-xs ml-auto"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                placeholder="Nova sub-tarefa"
                                className="text-sm"
                            />
                            <button
                                onClick={handleAddSubtask}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                            >
                                Adicionar
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Comentários (Log de Trabalho) */}
                <Card className="p-5">
                    <h3 className="font-semibold mb-3">Log de Trabalho</h3>
                    <div className="space-y-3 mb-4">
                        {comments.map(comment => (
                            <div key={comment.id} className="p-3 bg-gray-50 rounded">
                                <p className="text-sm">{comment.text}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {safeFormatDateTime(comment.createdAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Adicionar comentário..."
                            className="text-sm"
                        />
                        <button
                            onClick={handleAddComment}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                        >
                            Enviar
                        </button>
                    </div>
                </Card>
            </main>
        </ div>
    );
}