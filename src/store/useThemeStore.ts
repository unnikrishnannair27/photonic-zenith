import { create } from 'zustand';

interface ThemeState {
    canvasClasses: string[];
}

interface ThemeActions {
    setCanvasClasses: (classes: string[]) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>((set) => ({
    canvasClasses: [],
    setCanvasClasses: (classes) => set({ canvasClasses: classes }),
}));
