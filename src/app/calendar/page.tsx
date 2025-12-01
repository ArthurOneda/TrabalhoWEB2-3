'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Task } from '@/types';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    extendedProps: {
        task: Task;
    };
}

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser?.uid));
                const snapshot = await getDocs(q);
                const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];

                const calendarEvents: CalendarEvent[] = tasks
                    .filter(task => task.dueDate)
                    .map(task => ({
                        id: task.id,
                        title: task.title,
                        start: task.dueDate,
                        extendedProps: { task },
                    }));

                setEvents(calendarEvents);
            } catch (err) {
                console.error('Erro ao carregar tarefas:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const closeModal = () => setSelectedTask(null);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Carregando calendário...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">Calendário</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">
                        ← Voltar ao Dashboard
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow p-4">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        eventClick={({ event }) => {
                            const task = (event.extendedProps as any).task as Task;
                            setSelectedTask(task);
                        }}
                        eventContent={(arg) => (
                            <div className="flex items-center p-1">
                                <span className="text-xs font-medium truncate">{arg.event.title}</span>
                            </div>
                        )}
                        headerToolbar={{
                            left: 'title',
                            center: '',
                            right: 'prev,next today',
                        }}
                        locale="pt-br"
                        buttonText={{
                            today: 'Hoje',
                            month: 'Mês',
                        }}
                        height="auto"
                    />
                </div>
            </main>

            {/* Modal de Detalhes */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                    aria-label="Fechar"
                                >
                                    &times;
                                </button>
                            </div>

                            {selectedTask.description && (
                                <p className="text-gray-700 mb-3">{selectedTask.description}</p>
                            )}

                            <div className="space-y-2 text-sm text-gray-600">
                                <p><span className="font-medium">Vencimento:</span> {selectedTask.dueDate}</p>
                                <p><span className="font-medium">Prioridade:</span> {selectedTask.priority}</p>
                                <p><span className="font-medium">Status:</span> {selectedTask.status}</p>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Link
                                    href={`/tasks/${selectedTask.id}`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    onClick={closeModal}
                                >
                                    Ver Detalhes
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}