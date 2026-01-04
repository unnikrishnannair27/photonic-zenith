import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { type Node } from '../utils/dom';
import { EditableNode } from './EditableNode.tsx';

interface InteractiveFrameProps {
    width: string;
    height: string;
    label: string;
    nodes: Node[];
    headContent: string;
    onMove: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
    className?: string;
}

// Helper to find previous/next sibling IDs
function findNeighbors(nodes: Node[], targetId: string): { prevId: string | null, nextId: string | null } | null {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
            return {
                prevId: i > 0 ? nodes[i - 1].id : null,
                nextId: i < nodes.length - 1 ? nodes[i + 1].id : null
            };
        }
        if (nodes[i].type === 'element' && (nodes[i] as any).children) {
            const found = findNeighbors((nodes[i] as any).children, targetId);
            if (found) return found;
        }
    }
    return null;
}

export function InteractiveFrame({ width, height, label, nodes, headContent, onMove, className }: InteractiveFrameProps) {
    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
    const [hoverState, setHoverState] = useState<{ id: string, rect: DOMRect, tagName: string } | null>(null);
    const [neighbors, setNeighbors] = useState<{ prevId: string | null, nextId: string | null } | null>(null);
    const [dropTarget, setDropTarget] = useState<{ id: string, rect: DOMRect, tagName: string, position: 'top' | 'bottom' | 'inside' } | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Calculate neighbors on hover
    useEffect(() => {
        if (hoverState) {
            setNeighbors(findNeighbors(nodes, hoverState.id));
        } else {
            setNeighbors(null);
        }
    }, [hoverState, nodes]);

    useEffect(() => {
        if (iframeRef.current?.contentDocument) {
            const doc = iframeRef.current.contentDocument;

            // Setup Head
            doc.head.innerHTML = headContent;

            // Re-create scripts to ensure they execute (e.g. Tailwind CDN)
            Array.from(doc.head.querySelectorAll('script')).forEach(oldScript => {
                const newScript = doc.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(doc.createTextNode(oldScript.innerHTML));
                // Need to use parentNode to replace, or append to head if simple
                oldScript.parentNode?.replaceChild(newScript, oldScript);
            });

            // Setup Body Mount Point
            // Reset body content if needed or just append
            doc.body.innerHTML = '<div id="root"></div>';
            doc.body.style.margin = '0'; // reset default margin often useful

            setMountNode(doc.getElementById('root'));
        }
    }, [headContent]);

    return (
        <div className={clsx("flex flex-col items-center gap-2", className)}>
            <div className="text-sm font-medium text-gray-400">{label}</div>
            <div
                className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-700 transition-all duration-300 hover:shadow-2xl"
                style={{ width, height }}
            >
                <iframe
                    ref={iframeRef}
                    title={label}
                    className="w-full h-full border-none bg-white"
                />
                {mountNode && createPortal(
                    <div className="min-h-full" style={{ padding: '0.1px' }}>
                        {/* Padding prevents margin collapse issues at top level */}
                        {nodes.map(node => (
                            <EditableNode
                                key={node.id}
                                node={node}
                                onMove={onMove}
                                onHover={(id, rect, tagName) => setHoverState({ id, rect, tagName })}
                                onDropHover={(id, rect, tagName, position) => {
                                    if (!id || !rect || !tagName || !position) setDropTarget(null);
                                    else setDropTarget({ id, rect, tagName, position });
                                }}
                            />
                        ))}

                        {/* Hover Overlay */}
                        {hoverState && !dropTarget && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: hoverState.rect.top,
                                    left: hoverState.rect.left,
                                    width: hoverState.rect.width,
                                    height: hoverState.rect.height,
                                    pointerEvents: 'none',
                                    border: '1px solid #3b82f6',
                                    zIndex: 9999
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '0',
                                    display: 'flex',
                                    gap: '1px',
                                    pointerEvents: 'auto' // Re-enable pointer events for buttons
                                }}>
                                    <div style={{
                                        background: '#3b82f6',
                                        color: 'white',
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        borderRadius: '2px 2px 0 0',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {hoverState.tagName}
                                    </div>
                                    {neighbors?.prevId && (
                                        <button
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                onMove(hoverState.id, neighbors.prevId!, 'before');
                                            }}
                                            className="bg-blue-600 text-white px-2 rounded-t-sm hover:bg-blue-700 flex items-center justify-center border-l border-blue-400 font-bold"
                                            title="Move Up"
                                        >
                                            ↑
                                        </button>
                                    )}
                                    {neighbors?.nextId && (
                                        <button
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                onMove(hoverState.id, neighbors.nextId!, 'after');
                                            }}
                                            className="bg-blue-600 text-white px-2 rounded-t-sm hover:bg-blue-700 flex items-center justify-center border-l border-blue-400 font-bold"
                                            title="Move Down"
                                        >
                                            ↓
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Drop Target Overlay */}
                        {dropTarget && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: dropTarget.rect.top,
                                    left: dropTarget.rect.left,
                                    width: dropTarget.rect.width,
                                    height: dropTarget.rect.height,
                                    pointerEvents: 'none',
                                    zIndex: 10000 // Higher than hover
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: dropTarget.position === 'top' ? '-24px' : dropTarget.position === 'bottom' ? 'calc(100% + 4px)' : '-24px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#10b981', // Emerald 500
                                    color: 'white',
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {dropTarget.position === 'inside' ? `Inside ${dropTarget.tagName}` :
                                        dropTarget.position === 'top' ? `Before ${dropTarget.tagName}` : `After ${dropTarget.tagName}`}
                                </div>
                            </div>
                        )}

                        {nodes.length === 0 && (
                            <div className="p-10 text-center text-gray-400 border-2 border-dashed border-gray-200 m-4 rounded">
                                Empty Body
                            </div>
                        )}
                    </div>,
                    mountNode
                )}
            </div>
        </div>
    );
}
