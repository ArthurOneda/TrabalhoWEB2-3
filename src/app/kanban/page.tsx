'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    useDroppable,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Task } from '@/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { safeFormatDate } from '@/lib/utils';

type ColumnId = 'todo' | 'doing' | 'done';

const columns: { id: ColumnId; title: string; color: string }[] = [
    { id: 'todo', title: 'A Fazer', color: 'bg-blue-100' },
    { id: 'doing', title: 'Fazendo', color: 'bg-amber-100' },
    { id: 'done', title: 'Concluído', color: 'bg-green-100' },
];

function TaskItem({ task }: { task: Task }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
    };

    const priorityColor =
        task.priority === 'high' ? 'border-l-red-500' :
            task.priority === 'medium' ? 'border-l-amber-500' :
                'border-l-blue-500';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`p-4 mb-3 bg-white rounded-lg shadow border-l-4 ${priorityColor}`}
        >
            <h3 className="font-semibold">{task.title}</h3>
            {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
            <p className="text-xs text-gray-500 mt-2">Vence: {safeFormatDate(task.dueDate)}</p>
            <Link href={`/tasks/${task.id}`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                Ver detalhes
            </Link>
        </div>
    );
}

function Column({ id, title, color, tasks }: { id: ColumnId; title: string; color: string; tasks: Task[] }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 min-w-[280px] ${color} rounded-xl p-4`}
        >
            <h2 className="font-bold text-gray-800 mb-4">{title} ({tasks.length})</h2>
            <div className="space-y-2">
                {tasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
}

export default function KanbanPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser?.uid));
                const snapshot = await getDocs(q);
                const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
                setTasks(tasksData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;
        const taskId = active.id as string;
        const newStatus = over.id as ColumnId;

        if (!['todo', 'doing', 'done'].includes(newStatus)) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;

        try {
            await updateDoc(doc(db, 'tasks', taskId), {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });

            setTasks(prev =>
                prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
            );
        } catch (err) {
            console.error('Erro ao mover tarefa:', err);
            alert('Erro ao atualizar tarefa.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Carregando quadro Kanban...</p>
            </div>
        );
    }

    const grouped = {
        todo: tasks.filter(t => t.status === 'todo'),
        doing: tasks.filter(t => t.status === 'doing'),
        done: tasks.filter(t => t.status === 'done'),
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">Quadro Kanban</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">
                        ← Voltar ao Dashboard
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-6 overflow-x-auto pb-4">
                        {columns.map(col => (
                            <Column
                                key={col.id}
                                id={col.id}
                                title={col.title}
                                color={col.color}
                                tasks={grouped[col.id]}
                            />
                        ))}
                    </div>
                </DndContext>
            </main>
        </div>
    );
}