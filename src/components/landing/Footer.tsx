export function Footer() {
    return (
        <footer className="bg-gray-50 border-t mt-16">
            <div className="container mx-auto px-4 py-8 text-center text-gray-600 text-sm">
                <p>© {new Date().getFullYear()} TaskFlow. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
}