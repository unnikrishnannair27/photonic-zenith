import React, { useState } from 'react';
import { type Node } from '../utils/dom';
import { ChevronRight, ChevronDown, FileCode, Box, Type, Image, Link, Layout, MoreHorizontal, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { useComponentStore } from '../store/useComponentStore';

interface TreeViewProps {
    nodes: Node[];
    depth?: number;
}

const getNodeIcon = (tagName: string) => {
    switch (tagName.toLowerCase()) {
        case 'img': return <Image size={12} />;
        case 'a': return <Link size={12} />;
        case 'p':
        case 'span':
        case 'h1':
        case 'h2':
        case 'h3': return <Type size={12} />;
        case 'div':
        case 'section':
        case 'main':
        case 'header':
        case 'footer': return <Layout size={12} />;
        default: return <Box size={12} />;
    }
};

export function TreeView({ nodes, depth = 0 }: TreeViewProps) {
    return (
        <ul className="flex flex-col gap-0.5">
            {nodes.map(node => (
                <TreeItem
                    key={node.id}
                    node={node}
                    depth={depth}
                />
            ))}
        </ul>
    );
}

function TreeItem({ node, depth }: { node: Node, depth: number }) {
    const { moveNode, activeNodeId, setActiveNodeId, deleteNode, addNode } = useComponentStore();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState<'top' | 'bottom' | 'inside' | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    const createDefaultNode = (tagName: string = 'div'): Node => ({
        id: crypto.randomUUID(),
        type: 'element',
        tagName,
        attributes: { className: 'p-4 min-h-[50px] border border-dashed border-gray-300 bg-gray-50' },
        children: []
    });

    const isContainer = node.type === 'element' && node.children && node.children.length > 0;
    const tagName = node.type === 'element' ? node.tagName : 'TEXT';

    // Skip pure text nodes that are just whitespace to clean up the tree
    if (node.type === 'text' && node.content?.trim().length === 0) return null;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('nodeId', node.id);
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;

        // Split drop zones: Top 25%, Bottom 25%, Middle 50% (Inside)
        if (y < rect.height * 0.25) setIsDragOver('top');
        else if (y > rect.height * 0.75) setIsDragOver('bottom');
        else setIsDragOver('inside');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(null);

        const sourceId = e.dataTransfer.getData('nodeId');
        if (!sourceId || sourceId === node.id) return;

        let pos: 'before' | 'after' | 'inside' = 'inside';
        if (isDragOver === 'top') pos = 'before';
        else if (isDragOver === 'bottom') pos = 'after';

        // If it's a text node or empty void element, force before/after (cant drop inside)
        if (node.type === 'text' || ['img', 'br', 'hr', 'input'].includes(tagName)) {
            if (pos === 'inside') pos = 'after';
        }

        moveNode(sourceId, node.id, pos);
    };

    return (
        <li>
            <div
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragOver(null)}
                onDrop={handleDrop}
                onClick={(e) => { e.stopPropagation(); setActiveNodeId(node.id); }}
                onMouseLeave={() => setShowMenu(false)}
                className={`
                    group relative flex items-center gap-1 py-1 px-2 rounded cursor-pointer select-none text-xs transition-colors border
                    ${activeNodeId === node.id ? 'bg-blue-100 border-blue-200 text-blue-700' : 'hover:bg-gray-100 border-transparent text-gray-700'}
                    ${isDragOver === 'inside' ? 'bg-blue-50 ring-1 ring-blue-300' : ''}
                `}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
                {/* Drop Indicators */}
                {isDragOver === 'top' && (
                    <div
                        className="absolute top-0 right-0 h-0.5 bg-blue-500 pointer-events-none z-10"
                        style={{ left: `${depth * 12 + 4}px`, transform: 'translateY(-1px)' }}
                    />
                )}
                {isDragOver === 'bottom' && (
                    <div
                        className="absolute bottom-0 right-0 h-0.5 bg-blue-500 pointer-events-none z-10"
                        style={{ left: `${depth * 12 + 4}px`, transform: 'translateY(1px)' }}
                    />
                )}

                {/* Expand Toggle */}
                {isContainer ? (
                    <button
                        onMouseDown={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="p-0.5 hover:bg-black/5 rounded text-gray-400"
                    >
                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    </button>
                ) : (
                    <span className="w-3" /> // Spacer
                )}

                {/* Icon */}
                <span className="text-gray-400">
                    {node.type === 'text' ? <FileCode size={12} /> : getNodeIcon(tagName)}
                </span>

                {/* Label */}
                <span className="truncate">
                    {node.type === 'text'
                        ? (node.content?.substring(0, 15) || 'Text')
                        : tagName.toLowerCase()
                    }
                    {node.type === 'element' && node.attributes?.id && <span className="text-gray-400 ml-1">#{node.attributes.id}</span>}
                </span>



                {/* Context Actions */}
                <div className={`ml-auto flex items-center gap-1 ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 relative"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                </div>

                {/* Dropdown Menu */}
                {showMenu && (
                    <div className="absolute right-2 top-8 bg-white shadow-xl border border-gray-200 rounded-lg z-50 w-40 flex flex-col py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                addNode(createDefaultNode(), node.id, 'before');
                                setShowMenu(false);
                            }}
                            className="text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                            <ArrowUp size={12} /> Add Before
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                addNode(createDefaultNode(), node.id, 'after');
                                setShowMenu(false);
                            }}
                            className="text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                            <ArrowDown size={12} /> Add After
                        </button>
                        {isContainer && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addNode(createDefaultNode(), node.id, 'inside');
                                    setShowMenu(false);
                                    setIsExpanded(true);
                                }}
                                className="text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                                <Plus size={12} /> Add Inside
                            </button>
                        )}
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteNode(node.id);
                                setShowMenu(false);
                            }}
                            className="text-left px-3 py-2 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600"
                        >
                            <Trash2 size={12} /> Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Recursion for Children */}
            {
                isContainer && isExpanded && (
                    <div className="border-l border-gray-100 ml-3">
                        <TreeView
                            nodes={node.children}
                            depth={depth + 1}
                        />
                    </div>
                )
            }
        </li >
    );
}

