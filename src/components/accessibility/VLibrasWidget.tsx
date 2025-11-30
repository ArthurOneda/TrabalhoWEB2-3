'use client';

import { useEffect } from 'react';

export default function VLibrasWidget() {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        script.async = true;
        script.onload = () => {
            new window.VLibras.Widget();
        };
        document.body.appendChild(script);

        return () => {
            const existingScript = document.querySelector('script[src="https://vlibras.gov.br/app/vlibras-plugin.js"]');
            if (existingScript) document.body.removeChild(existingScript);
        };
    }, []);

    return null;
}