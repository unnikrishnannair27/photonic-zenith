import { useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface DeviceFrameProps {
    width: string;
    height: string;
    label: string;
    content: string;
    className?: string;
}

export function DeviceFrame({ width, height, label, content, className }: DeviceFrameProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current) {
            // We write to the document to ensure immediate update without flickering source
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(content);
                doc.close();
            }
        }
    }, [content]);

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
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        </div>
    );
}
