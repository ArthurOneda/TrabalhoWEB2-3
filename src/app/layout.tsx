import { AuthProvider } from '@/contexts/AuthProvider';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TaskFlow',
  description: 'Gestor de tarefas inteligente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* Aplicar AuthProvider em todas as rotas (exceto auth) */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}