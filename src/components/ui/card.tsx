import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: CardProps) {
    return <div className={`p-6 pb-2 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: CardProps) {
    return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = '' }: CardProps) {
    return <div className={`p-6 pt-2 ${className}`}>{children}</div>;
}