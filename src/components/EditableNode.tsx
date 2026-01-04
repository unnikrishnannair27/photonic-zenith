import React, { useState, useRef } from 'react';
import { type Node } from '../utils/dom';
import styleToObject from 'style-to-object';

interface EditableNodeProps {
    node: Node;
    onMove: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
    onHover?: (id: string, rect: DOMRect, tagName: string) => void;
    onDropHover?: (id: string | null, rect?: DOMRect, tagName?: string, position?: 'top' | 'bottom' | 'inside') => void;
}

export function EditableNode({ node, onMove, onHover, onDropHover }: EditableNodeProps) {
    const [isOver, setIsOver] = useState<'top' | 'bottom' | 'inside' | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Ref to optimize parent updates, preventing flood of events during drag
    const lastReportedPos = useRef<'top' | 'bottom' | 'inside' | null>(null);

    // Text nodes are simplest case
    if (node.type === 'text') {
        return (
            <span
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('nodeId', node.id);
                    e.stopPropagation();
                }}
                className="hover:bg-blue-100 cursor-text"
            >
                {node.content}
            </span>
        );
    }

    const reportDropHover = (pos: 'top' | 'bottom' | 'inside' | null, element: HTMLElement) => {
        if (pos === lastReportedPos.current) return;
        lastReportedPos.current = pos;

        if (pos && onDropHover) {
            const rect = element.getBoundingClientRect();
            onDropHover(node.id, rect, node.tagName, pos);
        } else if (!pos && onDropHover) {
            onDropHover(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;

        let pos: 'top' | 'bottom' | 'inside' = 'inside';
        if (y < rect.height * 0.25) pos = 'top';
        else if (y > rect.height * 0.75) pos = 'bottom';

        setIsOver(pos);
        reportDropHover(pos, e.currentTarget as HTMLElement);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        setIsOver(null);
        reportDropHover(null, e.currentTarget as HTMLElement);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        reportDropHover(null, e.currentTarget as HTMLElement);
        setIsOver(null);

        const sourceId = e.dataTransfer.getData('nodeId');
        if (sourceId && sourceId !== node.id) {
            const pos = isOver === 'top' ? 'before' : isOver === 'bottom' ? 'after' : 'inside';
            onMove(sourceId, node.id, pos);
        }
    };

    const Tag = node.tagName as string;
    const isVoid = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(node.tagName);

    let parsedStyle: Record<string, any> = {};
    if (node.attributes.style) {
        try {
            parsedStyle = styleToObject(node.attributes.style) || {};
        } catch (e) { }
    }

    const style = {
        ...parsedStyle,
        outline: isOver && isOver !== 'inside' ? '2px solid #3b82f6' : isOver === 'inside' ? '2px dashed #3b82f6' : undefined,
        outlineOffset: '-2px',
        backgroundColor: isOver === 'inside' ? 'rgba(59, 130, 246, 0.1)' : parsedStyle['backgroundColor'],
        boxShadow: isOver === 'top' ? '0 -4px 0 0 #3b82f6' : isOver === 'bottom' ? '0 4px 0 0 #3b82f6' : undefined,
        opacity: isDragging ? 0.4 : undefined,
        cursor: 'grab'
    };

    const commonProps = {
        ...node.attributes,
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.setData('nodeId', node.id);
            e.stopPropagation();
            setTimeout(() => setIsDragging(true), 0);
        },
        onDragEnd: () => setIsDragging(false),
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        onMouseOver: (e: React.MouseEvent) => {
            e.stopPropagation();
            // Report hover to parent Overlay system
            if (onHover) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                onHover(node.id, rect, node.tagName);
            }
        },
        onClick: (e: React.MouseEvent) => {
            if (node.tagName === 'a') {
                e.preventDefault();
            }
        },
        style
    };

    if (isVoid) {
        // @ts-ignore
        return <Tag {...commonProps} />;
    }

    return (
        // @ts-ignore
        <Tag {...commonProps}>
            {node.children.map(child => (
                <EditableNode
                    key={child.id}
                    node={child}
                    onMove={onMove}
                    onHover={onHover}
                    onDropHover={onDropHover}
                />
            ))}
        </Tag>
    );
}
