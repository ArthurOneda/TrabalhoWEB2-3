'use client'

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { CallToAction } from '@/components/landing/CallToAction';
import { motion } from 'framer-motion';

import dynamic from 'next/dynamic';

const VLibras = dynamic(
  () => import('@/components/accessibility/VLibrasWidget'),
  { ssr: false }
);

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-50 to-white">
        <CallToAction />
      </main>

      <Footer />

      {/* Widget de acessibilidade VLibras */}
      <VLibras />
    </div>
  );
}