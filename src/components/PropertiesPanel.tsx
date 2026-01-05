import React, { useState } from 'react';
import { Settings, Search, Trash2, X, Layers, Type, Box, Hash, Maximize, ChevronDown, ChevronRight } from 'lucide-react';
import { TAILWIND_CATEGORIES } from '../constants/tailwindCategories';
import { parseStyleString } from '../utils/dom';
import { useComponentStore } from '../store/useComponentStore';
import { useUIStore } from '../store/useUIStore';
import { filterValidTailwindClasses } from '../utils/tailwindValidation';


const CSS_SECTIONS = [
    {
        title: "Layout",
        properties: [
            { name: "display", type: "select", options: ["block", "flex", "grid", "inline", "inline-block", "none"] },
            { name: "position", type: "select", options: ["static", "relative", "absolute", "fixed", "sticky"] },
            { name: "top", type: "text", placeholder: "e.g., 10px, auto" },
            { name: "right", type: "text", placeholder: "e.g., 10px, auto" },
            { name: "bottom", type: "text", placeholder: "e.g., 10px, auto" },
            { name: "left", type: "text", placeholder: "e.g., 10px, auto" },
            { name: "z-index", type: "text", placeholder: "e.g., 10, 100" },
            { name: "overflow", type: "select", options: ["visible", "hidden", "scroll", "auto"] },
        ]
    },
    {
        title: "Typography",
        properties: [
            { name: "font-family", type: "text", placeholder: "Arial, sans-serif" },
            { name: "font-size", type: "text", placeholder: "16px, 1rem" },
            { name: "font-weight", type: "select", options: ["400", "500", "600", "700", "bold", "normal"] },
            { name: "line-height", type: "text", placeholder: "1.5, 24px" },
            { name: "color", type: "text", placeholder: "#000000, rgb(0,0,0)" },
            { name: "text-align", type: "select", options: ["left", "center", "right", "justify"] },
        ]
    },
    {
        title: "Background",
        properties: [
            { name: "background-color", type: "text", placeholder: "#ffffff" },
            { name: "background-image", type: "text", placeholder: "url(...)" },
            { name: "background-size", type: "select", options: ["auto", "cover", "contain"] },
            { name: "background-position", type: "text", placeholder: "center center" },
            { name: "background-repeat", type: "select", options: ["repeat", "no-repeat", "repeat-x", "repeat-y"] },
        ]
    }
];

const ELEMENT_ATTRIBUTES: Record<string, { name: string, label: string, type: 'text' | 'select', options?: string[], placeholder?: string }[]> = {
    img: [
        { name: 'src', label: 'Source URL', type: 'text', placeholder: 'https://example.com/image.jpg' },
        { name: 'alt', label: 'Alt Text', type: 'text', placeholder: 'Image description' },
        { name: 'width', label: 'Width', type: 'text', placeholder: 'auto' },
        { name: 'height', label: 'Height', type: 'text', placeholder: 'auto' },
    ],
    a: [
        { name: 'href', label: 'Link URL', type: 'text', placeholder: 'https://example.com' },
        { name: 'target', label: 'Target', type: 'select', options: ['_self', '_blank', '_parent', '_top'] },
    ],
    input: [
        { name: 'type', label: 'Type', type: 'select', options: ['text', 'password', 'email', 'number', 'checkbox', 'radio', 'submit', 'button', 'date', 'file'] },
        { name: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Enter text...' },
        { name: 'name', label: 'Name', type: 'text', placeholder: 'field_name' },
        { name: 'value', label: 'Value', type: 'text', placeholder: 'Initial value' },
    ],
    button: [
        { name: 'type', label: 'Type', type: 'select', options: ['button', 'submit', 'reset'] },
        { name: 'disabled', label: 'Disabled', type: 'select', options: ['false', 'true'] },
    ],
    iframe: [
        { name: 'src', label: 'Source URL', type: 'text', placeholder: 'https://...' },
        { name: 'title', label: 'Title', type: 'text', placeholder: 'Frame title' },
    ]
};

export const PropertiesPanel: React.FC = () => {
    const { updateNode, deleteNode, setActiveNodeId, getSelectedNode } = useComponentStore();
    const { activeViewport, setActiveViewport } = useUIStore();
    const selectedNode = getSelectedNode();
    const onClose = () => setActiveNodeId(null);

    const [classSearchQuery, setClassSearchQuery] = useState('');
    const [customClassInput, setCustomClassInput] = useState('');
    const [showVisualCssEditor, setShowVisualCssEditor] = useState(true);
    const [activeCssSections, setActiveCssSections] = useState<Record<string, boolean>>({ "Layout": true });
    const [activeModifier, setActiveModifier] = useState('');

    const PSEUDO_MODIFIERS = [
        { label: 'Default', value: '' },
        { label: 'Hover', value: 'hover' },
        { label: 'Focus', value: 'focus' },
        { label: 'Active', value: 'active' },
        { label: 'Disabled', value: 'disabled' },
        { label: 'Visited', value: 'visited' },
        { label: 'First Child', value: 'first' },
        { label: 'Last Child', value: 'last' },
        { label: 'Odd', value: 'odd' },
        { label: 'Even', value: 'even' },
    ];


    const VIEWPORT_PREFIXES: Record<string, string> = {
        mobile: '',
        tablet: 'md:',
        desktop: 'lg:',
        large: 'xl:',
    };

    // Helper to get current classes of selected node
    const getNodeClasses = (): string[] => {
        if (!selectedNode || selectedNode.type !== 'element') return [];
        return selectedNode.attributes.className
            ? selectedNode.attributes.className.split(' ').filter(Boolean)
            : [];
    };

    // Helper to update classes
    const updateNodeClasses = (newClasses: string[]) => {
        if (!selectedNode || selectedNode.type !== 'element') return;
        updateNode(selectedNode.id, {
            attributes: {
                ...selectedNode.attributes,
                className: newClasses.join(' ')
            }
        });
    };

    // Helper to update classes with modifier and viewport support
    const toggleTailwindClass = (prefixRegex: RegExp, newClassValue: string | null) => {
        const currentClasses = getNodeClasses();
        const viewportPrefix = VIEWPORT_PREFIXES[activeViewport] || '';
        const modifierPrefix = activeModifier ? `${activeModifier}:` : '';
        const fullPrefix = `${viewportPrefix}${modifierPrefix}`;

        const patternSource = prefixRegex.source.startsWith('^') ? prefixRegex.source.slice(1) : prefixRegex.source;

        // Match classes starting with the full prefix
        const targetPrefixRegex = new RegExp(`^${fullPrefix}${patternSource}`);

        const nextClasses = currentClasses.filter(c => !targetPrefixRegex.test(c));

        if (newClassValue) {
            nextClasses.push(fullPrefix + newClassValue);
        }

        updateNodeClasses(nextClasses);
    };

    const addClassToNode = (className: string) => {
        const currentClasses = getNodeClasses();
        const viewportPrefix = VIEWPORT_PREFIXES[activeViewport] || '';

        let finalClass = className;

        // If the class doesn't start with the viewport prefix, add it (if needed)
        if (viewportPrefix && !finalClass.startsWith(viewportPrefix)) {
            finalClass = `${viewportPrefix}${finalClass}`;
        }

        if (activeModifier) {
            // Insert activeModifier before class content but after viewport prefix
            if (!finalClass.includes(`:${activeModifier}:`) && !finalClass.startsWith(`${activeModifier}:`)) {
                if (viewportPrefix && finalClass.startsWith(viewportPrefix)) {
                    const bareClass = finalClass.slice(viewportPrefix.length);
                    if (!bareClass.startsWith(`${activeModifier}:`)) {
                        finalClass = `${viewportPrefix}${activeModifier}:${bareClass}`;
                    }
                } else if (!finalClass.startsWith(`${activeModifier}:`)) {
                    finalClass = `${activeModifier}:${finalClass}`;
                }
            }
        }

        if (!currentClasses.includes(finalClass)) {
            updateNodeClasses([...currentClasses, finalClass]);
        }
    };

    const removeClassFromNode = (className: string) => {
        const currentClasses = getNodeClasses();
        updateNodeClasses(currentClasses.filter(c => c !== className));
    };

    // Helper to search tailwind classes
    const searchTailwindClasses = (query: string) => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        const results: { class: string; category: string }[] = [];

        Object.entries(TAILWIND_CATEGORIES).forEach(([category, classes]) => {
            classes.forEach(cls => {
                if (cls.toLowerCase().includes(lowerQuery)) {
                    results.push({ class: cls, category });
                }
            });
        });
        return results.slice(0, 50);
    };

    const renderTailwindSelector = (targetClasses: string[], onAdd: (cls: string) => void) => (
        <div className="mt-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Add Tailwind Classes</label>
            <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 text-gray-400" size={14} />
                <input
                    type="text"
                    value={classSearchQuery}
                    onChange={(e) => setClassSearchQuery(e.target.value)}
                    placeholder="Search classes... (e.g., flex, bg-blue)"
                    className="w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md bg-white">
                {classSearchQuery.trim() ? (
                    <div>
                        {searchTailwindClasses(classSearchQuery).length > 0 ? (
                            searchTailwindClasses(classSearchQuery).map(({ class: cls, category }) => (
                                <button
                                    key={cls}
                                    onClick={() => onAdd(cls)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-sm flex items-center justify-between group"
                                >
                                    <span className="font-mono">{cls}</span>
                                    <span className="text-xs text-gray-400 group-hover:text-indigo-500">{category}</span>
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-center text-gray-400 text-xs">No classes found</div>
                        )}
                    </div>
                ) : (
                    Object.entries(TAILWIND_CATEGORIES).map(([category, classes]) => (
                        <details key={category} className="group">
                            <summary className="px-3 py-2 text-xs font-semibold uppercase text-gray-600 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                                {category} <span className="text-gray-400 font-normal normal-case">({classes.length})</span>
                            </summary>
                            <div className="p-2 bg-gray-50 flex flex-wrap gap-1">
                                {classes.map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => onAdd(cls)}
                                        className={`px-2 py-1 rounded text-xs border ${targetClasses.includes(cls) ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                                    >
                                        {cls}
                                    </button>
                                ))}
                            </div>
                        </details>
                    ))
                )}
            </div>
        </div>
    );

    if (!selectedNode) {
        return (
            <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full">
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-shrink-0">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Settings size={16} /> Properties
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
                    Select an element on the canvas to edit its properties
                </div>
            </div>
        );
    }

    // Text Node Editor
    if (selectedNode.type === 'text') {
        return (
            <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full">
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-shrink-0">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Type size={16} /> Text Properties
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => deleteNode(selectedNode.id)}
                            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Delete Text Node"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-600 uppercase">Content</label>
                        <textarea
                            value={selectedNode.content || ''}
                            onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                            className="w-full h-32 p-3 text-sm border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                            placeholder="Enter text..."
                        />
                    </div>
                </div>
            </div>
        )
    }

    const nodeClasses = getNodeClasses();

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full">
            {/* Header */}
            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-shrink-0">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Settings size={16} /> Properties
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => deleteNode(selectedNode.id)}
                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Delete Element"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <X size={16} />
                    </button>
                </div>

                {/* Modifier Selector */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] uppercase font-bold text-gray-400 whitespace-nowrap">State:</span>
                    <select
                        value={activeModifier}
                        onChange={(e) => setActiveModifier(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-indigo-500 font-medium text-gray-700"
                    >
                        {PSEUDO_MODIFIERS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    {activeModifier && (
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 animate-pulse">
                            Editing {activeModifier} styles
                        </span>
                    )}
                </div>

                {/* Viewport Selector */}
                <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] uppercase font-bold text-purple-400 whitespace-nowrap">Viewport:</span>
                    <select
                        value={activeViewport}
                        onChange={(e) => setActiveViewport(e.target.value as any)}
                        className="text-xs border border-purple-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-purple-500 font-medium text-purple-700"
                    >
                        <option value="mobile">Mobile (All)</option>
                        <option value="tablet">Tablet (md)</option>
                        <option value="desktop">Desktop (lg)</option>
                        <option value="large">Large (xl)</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Element Info & ID */}
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Selected Element</div>
                        <div className="font-mono text-sm font-bold text-indigo-900">
                            <span className="opacity-50">&lt;</span>{selectedNode.tagName}<span className="opacity-50">&gt;</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-gray-400"><Hash size={14} /></div>
                        <input
                            type="text"
                            placeholder="Element ID"
                            value={selectedNode.attributes.id || ''}
                            onChange={(e) => updateNode(selectedNode.id, {
                                attributes: { ...selectedNode.attributes, id: e.target.value }
                            })}
                            className="flex-1 bg-white border border-indigo-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Quick Text Edit for Elements with single text child */}
                {selectedNode.children?.length === 1 && selectedNode.children[0].type === 'text' && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 border-b px-3 py-2">
                            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                                <Type size={14} /> Text Content
                            </h3>
                        </div>
                        <div className="p-3 bg-white">
                            <textarea
                                value={selectedNode.children[0].content || ''}
                                onChange={(e) => updateNode(selectedNode.children![0].id, { content: e.target.value })}
                                className="w-full h-24 p-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                placeholder="Edit text content..."
                            />
                        </div>
                    </div>
                )}

                {/* Specific Element Attributes */}
                {ELEMENT_ATTRIBUTES[selectedNode.tagName] && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 border-b px-3 py-2">
                            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                                <Settings size={14} /> Attributes
                            </h3>
                        </div>
                        <div className="p-3 space-y-3 bg-white">
                            {ELEMENT_ATTRIBUTES[selectedNode.tagName].map(attr => (
                                <div key={attr.name}>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">{attr.label}</label>
                                    {attr.type === 'select' ? (
                                        <select
                                            value={selectedNode.attributes[attr.name] || ''}
                                            onChange={(e) => updateNode(selectedNode.id, {
                                                attributes: { ...selectedNode.attributes, [attr.name]: e.target.value }
                                            })}
                                            className="w-full text-xs border rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">Default</option>
                                            {attr.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={selectedNode.attributes[attr.name] || ''}
                                            onChange={(e) => updateNode(selectedNode.id, {
                                                attributes: { ...selectedNode.attributes, [attr.name]: e.target.value }
                                            })}
                                            placeholder={attr.placeholder}
                                            className="w-full text-xs border rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Size & Dimensions */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Maximize size={14} /> Size & Dimensions
                        </h3>
                    </div>
                    <div className="p-3 space-y-4">
                        {/* Width */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Width</label>
                            <div className="grid grid-cols-3 gap-1 mb-1">
                                {['w-auto', 'w-full', 'w-screen'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => toggleTailwindClass(/^w-/, cls)}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(activeModifier ? `${activeModifier}:${cls}` : cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls.replace('w-', '').charAt(0).toUpperCase() + cls.replace('w-', '').slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-1 mb-1">
                                {['w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4', 'w-fit'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('w-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls.replace('w-', '')}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {['w-32', 'w-48', 'w-64', 'w-96'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('w-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls.replace('w-', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max Width */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Max Width</label>
                            <div className="grid grid-cols-4 gap-1 mb-1">
                                {['max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('max-w-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls.replace('max-w-', '').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {['max-w-xl', 'max-w-2xl', 'max-w-full', 'max-w-none'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('max-w-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls === 'max-w-none' ? 'None' : cls.replace('max-w-', '').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Height */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Height</label>
                            <div className="grid grid-cols-3 gap-1 mb-1">
                                {['h-auto', 'h-full', 'h-screen'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('h-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls.replace('h-', '').charAt(0).toUpperCase() + cls.replace('h-', '').slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-1 mb-1">
                                {['h-fit', 'h-min', 'h-max'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('h-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls.replace('h-', '').charAt(0).toUpperCase() + cls.replace('h-', '').slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {['h-32', 'h-48', 'h-64', 'h-96'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('h-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls.replace('h-', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Min Height */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Min Height</label>
                            <div className="grid grid-cols-4 gap-1">
                                {['min-h-0', 'min-h-full', 'min-h-screen', 'min-h-fit'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('min-h-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls === 'min-h-0' ? '0' : cls.replace('min-h-', '').charAt(0).toUpperCase() + cls.replace('min-h-', '').slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-1">
                                {['aspect-auto', 'aspect-square', 'aspect-video'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            const newClasses = nodeClasses.filter(c => !c.startsWith('aspect-'));
                                            newClasses.push(cls);
                                            updateNodeClasses(newClasses);
                                        }}
                                        className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(cls) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        {cls === 'aspect-auto' ? 'Auto' : cls === 'aspect-square' ? '1:1' : '16:9'}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Layout Configuration */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Layers size={14} /> Layout
                        </h3>
                    </div>
                    <div className="p-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {['block', 'flex', 'grid'].map(layout => {
                                const isActive = layout === 'block'
                                    ? !nodeClasses.some(c => ['flex', 'grid', 'inline-flex', 'inline-grid'].includes(c))
                                    : nodeClasses.includes(layout);
                                return (
                                    <button
                                        key={layout}
                                        onClick={() => {
                                            const cls = nodeClasses.filter(c => !['flex', 'grid', 'inline-flex', 'inline-grid', 'block'].includes(c));
                                            if (layout !== 'block') cls.push(layout);
                                            updateNodeClasses(cls);
                                        }}
                                        className={`px-2 py-1.5 text-xs font-medium rounded border transition-all ${isActive
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {layout.charAt(0).toUpperCase() + layout.slice(1)}
                                    </button>
                                );
                            })}
                        </div>

                        {nodeClasses.includes('flex') && (
                            <div className="space-y-3 border-t pt-3">
                                {/* Flex Direction */}
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Direction</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { val: 'flex-row', label: 'Row →' },
                                            { val: 'flex-col', label: 'Col ↓' }
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => {
                                                    const cls = nodeClasses.filter(c => !['flex-row', 'flex-col'].includes(c));
                                                    cls.push(opt.val);
                                                    updateNodeClasses(cls);
                                                }}
                                                className={`px-2 py-1.5 text-xs rounded border ${nodeClasses.includes(opt.val)
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                    : 'bg-white border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Justify Content */}
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Justify</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {[
                                            { val: 'justify-start', icon: 'Start' },
                                            { val: 'justify-center', icon: 'Center' },
                                            { val: 'justify-end', icon: 'End' },
                                            { val: 'justify-between', icon: 'Betw' },
                                            { val: 'justify-around', icon: 'Arnd' },
                                            { val: 'justify-evenly', icon: 'Even' },
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => {
                                                    const cls = nodeClasses.filter(c => !c.startsWith('justify-'));
                                                    cls.push(opt.val);
                                                    updateNodeClasses(cls);
                                                }}
                                                className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(opt.val)
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                    : 'bg-white border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {opt.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Align Items */}
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Align Items</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {[
                                            { val: 'items-start', icon: 'Start' },
                                            { val: 'items-center', icon: 'Center' },
                                            { val: 'items-end', icon: 'End' },
                                            { val: 'items-stretch', icon: 'Strch' },
                                            { val: 'items-baseline', icon: 'Base' },
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => {
                                                    const cls = nodeClasses.filter(c => !c.startsWith('items-'));
                                                    cls.push(opt.val);
                                                    updateNodeClasses(cls);
                                                }}
                                                className={`px-1 py-1 text-[10px] rounded border ${nodeClasses.includes(opt.val)
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                    : 'bg-white border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {opt.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Gap */}
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Gap</label>
                                    <select
                                        onChange={(e) => {
                                            const cls = nodeClasses.filter(c => !c.startsWith('gap-'));
                                            if (e.target.value) cls.push(e.target.value);
                                            updateNodeClasses(cls);
                                        }}
                                        value={nodeClasses.find(c => c.startsWith('gap-')) || ''}
                                        className="w-full text-xs border rounded px-2 py-1 bg-white"
                                    >
                                        <option value="">0</option>
                                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                                            <option key={n} value={`gap-${n}`}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Typography / Text */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Type size={14} /> Typography
                        </h3>
                    </div>
                    <div className="p-3 space-y-3">
                        <div className="flex gap-2">
                            {/* Text Align */}
                            <div className="flex rounded border bg-white overflow-hidden">
                                {[
                                    { val: 'text-left', label: 'L' },
                                    { val: 'text-center', label: 'C' },
                                    { val: 'text-right', label: 'R' },
                                    { val: 'text-justify', label: 'J' },
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        onClick={() => {
                                            const cls = nodeClasses.filter(c => !c.startsWith('text-left') && !c.startsWith('text-center') && !c.startsWith('text-right') && !c.startsWith('text-justify'));
                                            cls.push(opt.val);
                                            updateNodeClasses(cls);
                                        }}
                                        className={`px-2 py-1 text-xs hover:bg-gray-50 ${nodeClasses.includes(opt.val) ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Font Weight */}
                            <select
                                onChange={(e) => {
                                    const cls = nodeClasses.filter(c => !c.startsWith('font-'));
                                    if (e.target.value) cls.push(e.target.value);
                                    updateNodeClasses(cls);
                                }}
                                className="text-xs border rounded px-2 bg-white flex-1"
                                value={nodeClasses.find(c => c.startsWith('font-') && !c.startsWith('font-size')) || ''}
                            >
                                <option value="">Normal</option>
                                <option value="font-light">Light</option>
                                <option value="font-medium">Medium</option>
                                <option value="font-semibold">Semibold</option>
                                <option value="font-bold">Bold</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Spacing / Box Model */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Box size={14} /> Spacing
                        </h3>
                    </div>
                    <div className="p-3 space-y-4">
                        {/* Padding */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Padding</label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {/* All Sides */}
                                <div className="space-y-1">
                                    <div className="text-[10px] text-gray-500">All Sides</div>
                                    <select
                                        onChange={(e) => {
                                            const cls = nodeClasses.filter(c => !c.match(/^p-\d+$/));
                                            if (e.target.value) cls.push(e.target.value);
                                            updateNodeClasses(cls);
                                        }}
                                        value={nodeClasses.find(c => c.match(/^p-\d+$/)) || ''}
                                        className="w-full text-xs border rounded px-1 py-1"
                                    >
                                        <option value="">-</option>
                                        {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32].map(n => <option key={n} value={`p-${n}`}>{n}</option>)}
                                    </select>
                                </div>
                                {/* X & Y Axis */}
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gray-500">PX</div>
                                        <select
                                            onChange={(e) => {
                                                const cls = nodeClasses.filter(c => !c.match(/^px-\d+$/));
                                                if (e.target.value) cls.push(e.target.value);
                                                updateNodeClasses(cls);
                                            }}
                                            value={nodeClasses.find(c => c.match(/^px-\d+$/)) || ''}
                                            className="w-full text-xs border rounded px-1 py-1"
                                        >
                                            <option value="">-</option>
                                            {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(n => <option key={n} value={`px-${n}`}>{n}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gray-500">PY</div>
                                        <select
                                            onChange={(e) => {
                                                const cls = nodeClasses.filter(c => !c.match(/^py-\d+$/));
                                                if (e.target.value) cls.push(e.target.value);
                                                updateNodeClasses(cls);
                                            }}
                                            value={nodeClasses.find(c => c.match(/^py-\d+$/)) || ''}
                                            className="w-full text-xs border rounded px-1 py-1"
                                        >
                                            <option value="">-</option>
                                            {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(n => <option key={n} value={`py-${n}`}>{n}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Margin */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Margin</label>
                            <div className="grid grid-cols-2 gap-2">
                                {/* All Sides */}
                                <div className="space-y-1">
                                    <div className="text-[10px] text-gray-500">All Sides</div>
                                    <select
                                        onChange={(e) => {
                                            const cls = nodeClasses.filter(c => !c.match(/^m-\d+$/) && c !== 'm-auto');
                                            if (e.target.value) cls.push(e.target.value);
                                            updateNodeClasses(cls);
                                        }}
                                        value={nodeClasses.find(c => c.match(/^m-\d+$/) || c === 'm-auto') || ''}
                                        className="w-full text-xs border rounded px-1 py-1"
                                    >
                                        <option value="">-</option>
                                        <option value="m-auto">Auto</option>
                                        {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32].map(n => <option key={n} value={`m-${n}`}>{n}</option>)}
                                    </select>
                                </div>
                                {/* X & Y Axis */}
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gray-500">MX</div>
                                        <select
                                            onChange={(e) => {
                                                const cls = nodeClasses.filter(c => !c.match(/^mx-\d+$/) && c !== 'mx-auto');
                                                if (e.target.value) cls.push(e.target.value);
                                                updateNodeClasses(cls);
                                            }}
                                            value={nodeClasses.find(c => c.match(/^mx-\d+$/) || c === 'mx-auto') || ''}
                                            className="w-full text-xs border rounded px-1 py-1"
                                        >
                                            <option value="">-</option>
                                            <option value="mx-auto">Auto</option>
                                            {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(n => <option key={n} value={`mx-${n}`}>{n}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gray-500">MY</div>
                                        <select
                                            onChange={(e) => {
                                                const cls = nodeClasses.filter(c => !c.match(/^my-\d+$/) && c !== 'my-auto');
                                                if (e.target.value) cls.push(e.target.value);
                                                updateNodeClasses(cls);
                                            }}
                                            value={nodeClasses.find(c => c.match(/^my-\d+$/) || c === 'my-auto') || ''}
                                            className="w-full text-xs border rounded px-1 py-1"
                                        >
                                            <option value="">-</option>
                                            <option value="my-auto">Auto</option>
                                            {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(n => <option key={n} value={`my-${n}`}>{n}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Classes & Custom */}
                <div className="space-y-4">
                    {/* Applied Classes */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Applied Classes</label>
                        <div className="flex flex-wrap gap-1.5 p-1 min-h-[30px]">
                            {nodeClasses.length > 0 ? (
                                nodeClasses.map((cls, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-700 group hover:border-red-300 hover:bg-red-50 transition-colors">
                                        {cls}
                                        <button
                                            onClick={() => removeClassFromNode(cls)}
                                            className="text-gray-400 group-hover:text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic">No classes applied</span>
                            )}
                        </div>
                    </div>

                    {/* Custom Class Input */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Custom Classes</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customClassInput}
                                onChange={(e) => setCustomClassInput(e.target.value)}
                                placeholder="my-class p-4"
                                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customClassInput.trim()) {
                                        const rawClasses = customClassInput.trim().split(/\s+/);
                                        const validClasses = filterValidTailwindClasses(rawClasses);

                                        if (validClasses.length < rawClasses.length) {
                                            console.warn('Some classes were filtered out as invalid:', rawClasses.filter(c => !validClasses.includes(c)));
                                        }

                                        if (validClasses.length > 0) {
                                            const currentClasses = getNodeClasses();
                                            const uniqueClasses = [...new Set([...currentClasses, ...validClasses])];
                                            updateNodeClasses(uniqueClasses);
                                        }
                                        setCustomClassInput('');
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    if (customClassInput.trim()) {
                                        const rawClasses = customClassInput.trim().split(/\s+/);
                                        const validClasses = filterValidTailwindClasses(rawClasses);

                                        if (validClasses.length < rawClasses.length) {
                                            console.warn('Some classes were filtered out as invalid:', rawClasses.filter(c => !validClasses.includes(c)));
                                        }

                                        if (validClasses.length > 0) {
                                            const currentClasses = getNodeClasses();
                                            const uniqueClasses = [...new Set([...currentClasses, ...validClasses])];
                                            updateNodeClasses(uniqueClasses);
                                        }
                                        setCustomClassInput('');
                                    }
                                }}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Tailwind Selector */}
                    {renderTailwindSelector(nodeClasses, addClassToNode)}
                </div>

                {/* Custom CSS Styles */}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">Custom CSS Styles</h3>
                        <button
                            onClick={() => setShowVisualCssEditor(!showVisualCssEditor)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-600 transition-colors"
                        >
                            {showVisualCssEditor ? 'Text Editor' : 'Visual Editor'}
                        </button>
                    </div>

                    {showVisualCssEditor ? (
                        <div className="space-y-2">
                            {CSS_SECTIONS.map((section) => {
                                const isExpanded = activeCssSections[section.title] !== false; // Default open
                                const styles = selectedNode.attributes.style ? parseStyleString(selectedNode.attributes.style) : {};
                                const count = section.properties.filter(p => styles[p.name]).length;

                                return (
                                    <div key={section.title} className="border rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => setActiveCssSections(prev => ({ ...prev, [section.title]: !isExpanded }))}
                                            className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                                                <span className="text-sm font-semibold text-gray-700 uppercase">{section.title}</span>
                                                {count > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{count}</span>}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="p-3 space-y-3 bg-white border-t border-gray-200">
                                                {section.properties.map(prop => (
                                                    <div key={prop.name}>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1">{prop.name}</label>
                                                        {prop.type === 'select' ? (
                                                            <select
                                                                value={styles[prop.name] || ''}
                                                                onChange={(e) => {
                                                                    const newStyles = { ...styles };
                                                                    if (e.target.value) {
                                                                        newStyles[prop.name] = e.target.value;
                                                                    } else {
                                                                        delete newStyles[prop.name];
                                                                    }
                                                                    const styleString = Object.entries(newStyles)
                                                                        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${v}`)
                                                                        .join('; ');
                                                                    updateNode(selectedNode.id, {
                                                                        attributes: { ...selectedNode.attributes, style: styleString }
                                                                    });
                                                                }}
                                                                className="w-full text-xs border rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            >
                                                                <option value="">-- Select --</option>
                                                                {prop.options?.map(opt => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : prop.name.includes('color') ? (
                                                            <div className="flex gap-2">
                                                                <div className="relative w-8 h-8 rounded border border-gray-300 overflow-hidden flex-shrink-0 bg-gray-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bDQKNGg0VjRoLTR6IiBmaWxsPSIjZGRkIi8+PC9zdmc+')]">
                                                                    <div
                                                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                                                        style={{ backgroundColor: styles[prop.name] || 'transparent' }}
                                                                    />
                                                                    <input
                                                                        type="color"
                                                                        value={styles[prop.name]?.match(/^#[0-9a-f]{6}$/i) ? styles[prop.name] : '#000000'}
                                                                        onChange={(e) => {
                                                                            const newStyles = { ...styles };
                                                                            newStyles[prop.name] = e.target.value;
                                                                            const styleString = Object.entries(newStyles)
                                                                                .map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${v}`)
                                                                                .join('; ');
                                                                            updateNode(selectedNode.id, {
                                                                                attributes: { ...selectedNode.attributes, style: styleString }
                                                                            });
                                                                        }}
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-0"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={styles[prop.name] || ''}
                                                                    onChange={(e) => {
                                                                        const newStyles = { ...styles };
                                                                        if (e.target.value) {
                                                                            newStyles[prop.name] = e.target.value;
                                                                        } else {
                                                                            delete newStyles[prop.name];
                                                                        }
                                                                        const styleString = Object.entries(newStyles)
                                                                            .map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${v}`)
                                                                            .join('; ');
                                                                        updateNode(selectedNode.id, {
                                                                            attributes: { ...selectedNode.attributes, style: styleString }
                                                                        });
                                                                    }}
                                                                    placeholder={prop.placeholder || 'auto'}
                                                                    className="flex-1 text-xs border rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={styles[prop.name] || ''}
                                                                onChange={(e) => {
                                                                    const newStyles = { ...styles };
                                                                    if (e.target.value) {
                                                                        newStyles[prop.name] = e.target.value;
                                                                    } else {
                                                                        delete newStyles[prop.name];
                                                                    }
                                                                    const styleString = Object.entries(newStyles)
                                                                        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${v}`)
                                                                        .join('; ');
                                                                    updateNode(selectedNode.id, {
                                                                        attributes: { ...selectedNode.attributes, style: styleString }
                                                                    });
                                                                }}
                                                                placeholder={prop.placeholder || 'auto'}
                                                                className="w-full text-xs border rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div>
                            <textarea
                                value={selectedNode.attributes.style || ''}
                                onChange={(e) => {
                                    updateNode(selectedNode.id, {
                                        attributes: { ...selectedNode.attributes, style: e.target.value }
                                    });
                                }}
                                placeholder="color: red; margin: 10px;"
                                className="w-full h-48 p-3 text-xs font-mono border rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-2">
                                Write standard CSS properties. e.g., <code className="bg-gray-100 px-1 rounded">color: #333;</code>
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
