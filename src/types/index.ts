export type Priority = 'low' | 'medium' | 'high';

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    userId: string;
    title: string;
    description: string;
    dueDate: string;
    priority: Priority;
    status: 'todo' | 'doing' | 'done';
    subtasks: Subtask[];
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
}