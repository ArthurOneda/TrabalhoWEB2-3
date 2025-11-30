'use client';

import Link from 'next/link';
import { Menu, X, LogIn } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold text-blue-600">
                    TaskFlow
                </Link>

                {/* Desktop Menu */}
                <nav className="hidden md:flex space-x-6">
                    <Link href="/#features" className="text-gray-600 hover:text-blue-600">
                        Recursos
                    </Link>
                    <Link href="/#about" className="text-gray-600 hover:text-blue-600">
                        Sobre
                    </Link>
                    <Link href="/auth/login" className="flex items-center text-blue-600 font-medium">
                        <LogIn className="w-4 h-4 mr-1" />
                        Login
                    </Link>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-gray-600"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-t">
                    <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                        <Link href="/#features" className="text-gray-600 hover:text-blue-600" onClick={() => setIsOpen(false)}>
                            Recursos
                        </Link>
                        <Link href="/#about" className="text-gray-600 hover:text-blue-600" onClick={() => setIsOpen(false)}>
                            Sobre
                        </Link>
                        <Link href="/auth/login" className="text-blue-600 font-medium" onClick={() => setIsOpen(false)}>
                            Login
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}