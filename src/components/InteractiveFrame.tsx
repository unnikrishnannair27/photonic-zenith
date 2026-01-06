import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { type Node, findNodeById } from '../utils/dom'; // Added findNodeById
import { EditableNode } from './EditableNode.tsx';
import { useComponentStore } from '../store/useComponentStore';
import styleToObject from 'style-to-object'; // Ensure this is installed or use custom parser

interface InteractiveFrameProps {
    width: string;
    height: string;
    label: string;
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

export function InteractiveFrame({ width, height, label, className }: InteractiveFrameProps) {
    const { docState, activeNodeId, moveNode, deleteNode, updateNode, undo, redo, saveHistory } = useComponentStore();
    const nodes = docState.body;
    const headContent = docState.head;

    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
    const [hoverState, setHoverState] = useState<{ id: string, rect: DOMRect, tagName: string } | null>(null);
    const [selectionState, setSelectionState] = useState<{ id: string, rect: DOMRect, tagName: string } | null>(null);
    const [neighbors, setNeighbors] = useState<{ prevId: string | null, nextId: string | null } | null>(null);
    const [dropTarget, setDropTarget] = useState<{ id: string, rect: DOMRect, tagName: string, position: 'top' | 'bottom' | 'inside' } | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isResizing, setIsResizing] = useState<{
        startX: number,
        startY: number,
        startWidth: number,
        startHeight: number,
        direction: string
    } | null>(null);

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        e.preventDefault();
        if (!selectionState) return;
        saveHistory(); // Save BEFORE resize starts
        console.log("Resize Start", direction);
        setIsResizing({
            startX: e.screenX,
            startY: e.screenY,
            startWidth: selectionState.rect.width,
            startHeight: selectionState.rect.height,
            direction
        });
    };

    useEffect(() => {
        if (!isResizing || !selectionState) return;

        const onMove = (e: MouseEvent) => {
            const dx = e.screenX - isResizing.startX;
            const dy = e.screenY - isResizing.startY;

            let newW = isResizing.startWidth;
            let newH = isResizing.startHeight;

            // Visual multiplier to make it feel 1:1 despite zoom or iframe context?
            // Screen coords are 1:1 usually.

            if (isResizing.direction.includes('e')) newW += dx;
            if (isResizing.direction.includes('w')) newW -= dx;
            if (isResizing.direction.includes('s')) newH += dy;
            if (isResizing.direction.includes('n')) newH -= dy;

            // Constraint
            if (newW < 10) newW = 10;
            if (newH < 10) newH = 10;

            const node = findNodeById(nodes, selectionState.id);
            if (!node || node.type !== 'element') return;

            let currentStyle = {};
            try {
                if (node.attributes.style) {
                    currentStyle = styleToObject(node.attributes.style) || {};
                }
            } catch (e) { }

            const newStyleObj = {
                ...currentStyle,
                width: `${newW}px`,
                height: `${newH}px`
            };

            // Re-serialize style
            // We use simple map, but converting camelCase back to kebab-case might be needed if styleToObject returns camel?
            // style-to-object returns property names as written in CSS (kebab-case usually).
            // Let's safe guard.
            const styleStr = Object.entries(newStyleObj)
                .map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${v}`)
                .join('; ');

            updateNode(selectionState.id, {
                attributes: {
                    ...node.attributes,
                    style: styleStr
                }
            }, { skipHistory: true }); // Skip history on move
        };

        const onUp = () => setIsResizing(null);

        // Attach to both windows to handle dragging outside iframe
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        const iframeWin = iframeRef.current?.contentWindow;
        if (iframeWin) {
            iframeWin.addEventListener('mousemove', onMove);
            iframeWin.addEventListener('mouseup', onUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            if (iframeWin) {
                iframeWin.removeEventListener('mousemove', onMove);
                iframeWin.removeEventListener('mouseup', onUp);
            }
        };
    }, [isResizing, selectionState, nodes, updateNode]); // Depend on nodes to get fresh style

    // Calculate neighbors on hover
    useEffect(() => {
        if (hoverState) {
            setNeighbors(findNeighbors(nodes, hoverState.id));
        } else {
            setNeighbors(null);
        }
    }, [hoverState, nodes]);

    // Handle Active Selection
    useEffect(() => {
        if (!activeNodeId || !iframeRef.current?.contentDocument) {
            setSelectionState(null);
            return;
        }

        const doc = iframeRef.current.contentDocument;
        const el = doc.querySelector(`[data-node-id="${activeNodeId}"]`) as HTMLElement;

        if (el) {
            const updateRect = () => {
                const rect = el.getBoundingClientRect();
                setSelectionState({
                    id: activeNodeId,
                    rect,
                    tagName: el.tagName
                });
            };

            updateRect();
            // Scroll to view
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

            // Detect resize/mutation? For now, simplistic.
            window.addEventListener('resize', updateRect);
            return () => window.removeEventListener('resize', updateRect);
        } else {
            setSelectionState(null);
        }
    }, [activeNodeId, nodes, width, height]); // Re-run when nodes change or layout changes

    useEffect(() => {
        if (iframeRef.current?.contentDocument) {
            const doc = iframeRef.current.contentDocument;

            // Setup Head
            doc.head.innerHTML = headContent;

            // Design Mode Overrides: Force mobile menus to be visible if they exist
            // This is a heuristic to help users edit hidden content
            const style = doc.createElement('style');
            style.textContent = `
                /* Force visibility of common mobile menu patterns in design view */
                .mobile-menu, .mobile-sub-menu {
                    display: block !important;
                    max-height: none !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                }
            `;
            doc.head.appendChild(style);

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

            // Keyboard Shortcuts inside Iframe
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.metaKey || e.ctrlKey) {
                    if (e.key === 'z') {
                        e.preventDefault();
                        if (e.shiftKey) redo();
                        else undo();
                    }
                    else if (e.key === 'y') {
                        e.preventDefault();
                        redo();
                    }
                }
            };
            doc.defaultView?.addEventListener('keydown', handleKeyDown);

            // Cleanup listener on unmount/change? 
            // The useEffect has [headContent]. If head changes, this reruns.
            // Ideally we should return cleanup function.
            // But checking doc.defaultView in cleanup might be tricky if iframe is gone.
            // I'll add it to the cleanup logic below if I can, but cleanup of this specific effect creates new mountNode?
            // Actually, `headContent` changes rarely.
            // Let's refine the listener attachment.
        }
    }, [headContent, undo, redo]); // Add undo/redo dependencies for closure capture if they change? (Store functions are stable usually)

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
                                onHover={(id, rect, tagName) => setHoverState({ id, rect, tagName })}
                                onDropHover={(id, rect, tagName, position) => {
                                    if (!id || !rect || !tagName || !position) setDropTarget(null);
                                    else setDropTarget({ id, rect, tagName, position });
                                }}
                            />
                        ))}


                        {/* Selection Overlay (Active) */}
                        {selectionState && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: selectionState.rect.top,
                                    left: selectionState.rect.left,
                                    width: selectionState.rect.width,
                                    height: selectionState.rect.height,
                                    pointerEvents: 'none',
                                    border: '2px solid #3b82f6', // Solid blue
                                    zIndex: 9998 // Below hover overlay
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '0',
                                    background: '#3b82f6',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '2px 2px 0 0',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {selectionState.tagName}
                                </div>

                                {/* Resize Handles */}
                                {['nw', 'ne', 'se', 'sw'].map(cursor => (
                                    <div
                                        key={cursor}
                                        onMouseDown={(e) => handleResizeStart(e, cursor)}
                                        style={{
                                            position: 'absolute',
                                            width: '8px',
                                            height: '8px',
                                            background: 'white',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '50%',
                                            pointerEvents: 'auto',
                                            cursor: `${cursor}-resize`,
                                            top: cursor.includes('n') ? '-4px' : 'auto',
                                            bottom: cursor.includes('s') ? '-4px' : 'auto',
                                            left: cursor.includes('w') ? '-4px' : 'auto',
                                            right: cursor.includes('e') ? '-4px' : 'auto',
                                            zIndex: 10001
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Hover Overlay */}
                        {hoverState && !dropTarget && hoverState.id !== activeNodeId && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: hoverState.rect.top,
                                    left: hoverState.rect.left,
                                    width: hoverState.rect.width,
                                    height: hoverState.rect.height,
                                    pointerEvents: 'none',
                                    border: '1px solid #60a5fa', // Lighter blue for hover
                                    zIndex: 9999
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '-24px',
                                    left: '0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px', // gap between breadcrumbs and label
                                    alignItems: 'flex-start',
                                    pointerEvents: 'auto'
                                }}>
                                    {/* Main Label and Controls */}
                                    <div className="flex gap-px">
                                        <div style={{
                                            background: '#60a5fa',
                                            color: 'white',
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            borderRadius: '2px 2px 0 0',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                            {hoverState.tagName}
                                        </div>
                                        {/* ... buttons ... */}
                                        {neighbors?.prevId && (
                                            <>
                                                <button
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        moveNode(hoverState.id, neighbors.prevId!, 'before');
                                                    }}
                                                    className="bg-blue-600 text-white px-2 rounded-t-sm hover:bg-blue-700 flex items-center justify-center border-l border-blue-400 font-bold"
                                                    title="Move Left (Previous)"
                                                >
                                                    ←
                                                </button>
                                                <button
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        moveNode(hoverState.id, neighbors.prevId!, 'before');
                                                    }}
                                                    className="bg-blue-600 text-white px-2 rounded-t-sm hover:bg-blue-700 flex items-center justify-center border-l border-blue-400 font-bold"
                                                    title="Move Up (Previous)"
                                                >
                                                    ↑
                                                </button>
                                            </>
                                        )}
                                        {neighbors?.nextId && (
                                            <>
                                                <button
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        moveNode(hoverState.id, neighbors.nextId!, 'after');
                                                    }}
                                                    className="bg-blue-600 text-white px-2 rounded-t-sm hover:bg-blue-700 flex items-center justify-center border-l border-blue-400 font-bold"
                                                    title="Move Down (Next)"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        moveNode(hoverState.id, neighbors.nextId!, 'after');
                                                    }}
                                                    className="bg-blue-600 text-white px-2 rounded-t-sm hover:bg-blue-700 flex items-center justify-center border-l border-blue-400 font-bold"
                                                    title="Move Right (Next)"
                                                >
                                                    →
                                                </button>
                                            </>
                                        )}
                                        {deleteNode && (
                                            <button
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Delete this element?')) {
                                                        deleteNode(hoverState.id);
                                                    }
                                                }}
                                                className="bg-red-500 text-white px-2 rounded-t-sm hover:bg-red-600 flex items-center justify-center border-l border-red-400 font-bold ml-px"
                                                title="Delete Element"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
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
