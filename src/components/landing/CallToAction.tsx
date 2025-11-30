'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function CallToAction() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
        >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Organize seu dia, conquiste seus objetivos
            </h2>
            <p className="text-lg text-gray-600 mb-8">
                TaskFlow te ajuda a gerenciar tarefas, acompanhar prazos e aumentar sua produtividade — tudo em um só lugar.
            </p>
            <Link
                href="/auth/register"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
                Comece Grátis
            </Link>
        </motion.div>
    );
}