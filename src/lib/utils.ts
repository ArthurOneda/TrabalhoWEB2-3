import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function safeFormatDate(date: string | Date | undefined, fallback = '—'): string {
    if (!date) return fallback;

    const parsedDate = date instanceof Date ? date : new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return fallback;
    }

    return format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
}

export function safeFormatDateTime(date: string | Date | undefined, fallback = '—'): string {
    if (!date) return fallback;

    const parsedDate = date instanceof Date ? date : new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return fallback;
    }

    return format(parsedDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
}