import { create } from 'zustand';

interface UIState {
    activeViewport: 'mobile' | 'tablet' | 'desktop' | 'large';
    showImportModal: boolean;
    showCodeModal: boolean;
    activeCodeTab: 'html' | 'react';
    showPreviewModal: boolean;
    sidebarTab: 'add' | 'elements' | 'layers';
    expandedCategories: string[];
    isDragging: boolean;
    leftPanelOpen: boolean;
    rightPanelOpen: boolean;
    leftPanelWidth: number;
    rightPanelWidth: number;
}

interface UIActions {
    setActiveViewport: (viewport: 'mobile' | 'tablet' | 'desktop' | 'large') => void;
    setShowImportModal: (show: boolean) => void;
    setShowCodeModal: (show: boolean) => void;
    setActiveCodeTab: (tab: 'html' | 'react') => void;
    setShowPreviewModal: (show: boolean) => void;
    setSidebarTab: (tab: 'add' | 'elements' | 'layers') => void;
    setExpandedCategories: (categories: string[]) => void;
    toggleCategory: (category: string) => void;
    setIsDragging: (isDragging: boolean) => void;
    toggleLeftPanel: () => void;
    toggleRightPanel: () => void;
    setLeftPanelWidth: (width: number) => void;
    setRightPanelWidth: (width: number) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
    activeViewport: 'desktop',
    showImportModal: false,
    showCodeModal: false,
    activeCodeTab: 'html',
    showPreviewModal: false,
    sidebarTab: 'add',
    expandedCategories: ['Structure', 'Typography'],
    isDragging: false,
    leftPanelOpen: true,
    rightPanelOpen: true,
    leftPanelWidth: 280,
    rightPanelWidth: 320,

    setActiveViewport: (viewport) => set({ activeViewport: viewport }),
    setShowImportModal: (show) => set({ showImportModal: show }),
    setShowCodeModal: (show) => set({ showCodeModal: show }),
    setActiveCodeTab: (tab) => set({ activeCodeTab: tab }),
    setShowPreviewModal: (show) => set({ showPreviewModal: show }),
    setSidebarTab: (tab) => set({ sidebarTab: tab }),
    setExpandedCategories: (categories) => set({ expandedCategories: categories }),
    toggleCategory: (category) => set((state) => ({
        expandedCategories: state.expandedCategories.includes(category)
            ? state.expandedCategories.filter((c) => c !== category)
            : [...state.expandedCategories, category],
    })),
    setIsDragging: (isDragging) => set({ isDragging }),
    toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
    toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
    setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
    setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
}));
