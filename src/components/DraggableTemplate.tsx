import { useEffect, useRef, useState } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

interface DraggableTemplateProps {
    label: string;
    html: string;
    icon: React.ReactNode;
}

export function DraggableTemplate({ label, html, icon }: DraggableTemplateProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isCmptDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        return draggable({
            element: el,
            getInitialData: () => ({ html, label }),
            onDragStart: () => setIsDragging(true),
            onDrop: () => setIsDragging(false),
        });
    }, [html, label]);

    return (
        <div
            ref={ref}
            className={`
        p-3 bg-[#222] border rounded-lg cursor-grab active:cursor-grabbing flex items-center gap-3 transition-all hover:bg-[#333]
        ${isCmptDragging ? 'opacity-50 border-indigo-500' : 'border-[#333]'}
      `}
        >
            <div className="text-gray-400">{icon}</div>
            <span className="text-gray-200 text-sm font-medium">{label}</span>
        </div>
    );
}
