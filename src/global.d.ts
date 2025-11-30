export { };

declare global {
    interface Window {
        VLibras: {
            Widget: new () => void;
        };
    }
}