import { create } from 'zustand';
import { parseHtml, serializeTreeToHtml, updateNodeInTree, findNodeById, type Node, type ParsedDocument } from '../utils/dom';

const DEFAULT_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dental Navbar - Inline Styles</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .group:hover .group-hover\\:block { display: block; }
        .group:hover .group-hover\\:visible { visibility: visible; }
        .group:hover .group-hover\\:opacity-100 { opacity: 1; }
        .mobile-toggle:checked~.mobile-menu { display: block; }
        .mobile-sub-toggle:checked~.mobile-sub-menu { max-height: 2000px; opacity: 1; padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .mobile-sub-menu { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease-in-out; }
        .mobile-sub-toggle:checked+label { background-color: #f3f4f6; color: #003399; font-weight: 700; }
        .mobile-sub-menu a { transition: all 0.2s ease-in-out; border-left: 3px solid transparent; }
        .mobile-sub-menu a:hover, .mobile-sub-menu a:focus { color: #003399 !important; background-color: #eff6ff; border-left-color: #003399; padding-left: 1.5rem; }
        .mobile-menu a:not(.mobile-sub-menu a), .mobile-menu label { transition: all 0.2s ease-in-out; border-left: 3px solid transparent; }
        .mobile-menu a:not(.mobile-sub-menu a):hover, .mobile-menu label:hover { color: #003399; background-color: #eff6ff; border-left-color: #003399; padding-left: 1.25rem; }
    </style>
</head>
<body class="bg-gray-100 font-sans text-gray-900">
    <div class="p-10 text-center">
        <h1 class="text-2xl font-bold text-blue-600">Drag & Drop Playground</h1>
        <p class="mt-2 text-gray-600">Import your HTML to get started or drag elements from the left.</p>
    </div>
</body>
</html>
`;

interface ComponentState {
    docState: ParsedDocument;
    htmlInput: string;
    activeNodeId: string | null;
}

interface ComponentActions {
    setHtmlInput: (html: string) => void;
    setDocState: (doc: ParsedDocument) => void;
    setActiveNodeId: (id: string | null) => void;
    updateNode: (id: string, updates: any) => void;
    deleteNode: (id: string) => void;
    moveNode: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
    addNode: (node: Node, targetId: string, position: 'before' | 'after' | 'inside') => void;
    getSelectedNode: () => Node | null;
    projectConfig: { name: string, path: string } | null;
    setProjectConfig: (config: { name: string, path: string } | null) => void;
    isAstroMode: boolean;
    toggleAstroMode: () => void;
}

export const useComponentStore = create<ComponentState & ComponentActions>((set, get) => ({
    docState: parseHtml(DEFAULT_HTML),
    htmlInput: DEFAULT_HTML,
    activeNodeId: null,
    projectConfig: null,
    isAstroMode: false,

    setProjectConfig: (config) => set({ projectConfig: config }),
    toggleAstroMode: () => set((state) => ({ isAstroMode: !state.isAstroMode })),

    setHtmlInput: (html: string) => {
        try {
            const newDoc = parseHtml(html);
            set({ htmlInput: html, docState: newDoc });
        } catch (e) {
            console.error("Failed to parse HTML", e);
            // Still update input even if parse fails? user typing...
            set({ htmlInput: html });
        }
    },

    setDocState: (doc: ParsedDocument) => {
        const newHtml = serializeTreeToHtml(doc);
        set({ docState: doc, htmlInput: newHtml });
    },

    setActiveNodeId: (id: string | null) => set({ activeNodeId: id }),

    updateNode: (id: string, updates: any) => {
        const { docState } = get();
        const newBody = updateNodeInTree(docState.body, id, updates);
        const newDoc = { ...docState, body: newBody };
        const newHtml = serializeTreeToHtml(newDoc);
        set({ docState: newDoc, htmlInput: newHtml });
    },

    deleteNode: (id: string) => {
        const { docState, activeNodeId } = get();

        const remove = (nodes: Node[]): Node[] => {
            const filtered: Node[] = [];
            for (const node of nodes) {
                if (node.id === id) continue;
                if (node.type === 'element') node.children = remove(node.children);
                filtered.push(node);
            }
            return filtered;
        };

        const newBody = remove(docState.body);
        const newDoc = { ...docState, body: newBody };
        const newHtml = serializeTreeToHtml(newDoc);

        set({
            docState: newDoc,
            htmlInput: newHtml,
            activeNodeId: activeNodeId === id ? null : activeNodeId
        });
    },

    moveNode: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
        const { docState } = get();

        // Deep clone to avoid mutation issues
        const cloneNodes = (nodes: Node[]): Node[] => nodes.map(n => n.type === 'element' ? { ...n, children: cloneNodes(n.children) } : { ...n });
        let newBody = cloneNodes(docState.body);
        let sourceNode: Node | null = null;

        // Remove
        const remove = (nodes: Node[]): Node[] => {
            const filtered: Node[] = [];
            for (const node of nodes) {
                if (node.id === sourceId) { sourceNode = node; continue; }
                if (node.type === 'element') node.children = remove(node.children);
                filtered.push(node);
            }
            return filtered;
        };
        newBody = remove(newBody);

        if (!sourceNode) return;

        // Insert
        const insert = (nodes: Node[]): Node[] => {
            const result: Node[] = [];
            for (const node of nodes) {
                if (node.id === targetId) {
                    if (position === 'before') result.push(sourceNode!, node);
                    else if (position === 'after') result.push(node, sourceNode!);
                    else if (position === 'inside' && node.type === 'element') { node.children.push(sourceNode!); result.push(node); }
                    else result.push(node);
                } else {
                    if (node.type === 'element') node.children = insert(node.children);
                    result.push(node);
                }
            }
            return result;
        };
        newBody = insert(newBody);

        const newDoc = { ...docState, body: newBody };
        const newHtml = serializeTreeToHtml(newDoc);
        set({ docState: newDoc, htmlInput: newHtml });
    },

    addNode: (nodeToAdd: Node, targetId: string, position: 'before' | 'after' | 'inside') => {
        const { docState } = get();

        const cloneNodes = (nodes: Node[]): Node[] => nodes.map(n => n.type === 'element' ? { ...n, children: cloneNodes(n.children) } : { ...n });
        let newBody = cloneNodes(docState.body);

        const insert = (nodes: Node[]): Node[] => {
            const result: Node[] = [];
            for (const node of nodes) {
                if (node.id === targetId) {
                    if (position === 'before') result.push(nodeToAdd, node);
                    else if (position === 'after') result.push(node, nodeToAdd);
                    else if (position === 'inside' && node.type === 'element') { node.children.push(nodeToAdd); result.push(node); }
                    else result.push(node);
                } else {
                    if (node.type === 'element') node.children = insert(node.children);
                    result.push(node);
                }
            }
            return result;
        };

        // Handle case where target is root/body? 
        // With current logic, if targetId isn't found, it won't add.
        // Assuming targetId is always valid node in tree.
        newBody = insert(newBody);

        const newDoc = { ...docState, body: newBody };
        const newHtml = serializeTreeToHtml(newDoc);
        set({ docState: newDoc, htmlInput: newHtml });
    },

    getSelectedNode: () => {
        const { docState, activeNodeId } = get();
        if (!activeNodeId) return null;
        return findNodeById(docState.body, activeNodeId);
    }
}));
