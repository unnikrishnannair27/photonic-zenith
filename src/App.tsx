import { useState, useEffect, useRef, useCallback } from 'react';
import { InteractiveFrame } from './components/InteractiveFrame';
import { DraggableTemplate } from './components/DraggableTemplate';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Code, Smartphone, Tablet, Monitor, Layout, Box, Type, MousePointer2, ExternalLink, X, Eye, FileCode } from 'lucide-react';
import { parseHtml, serializeTreeToHtml, type Node, type ParsedDocument } from './utils/dom';
import { generateReactCode } from './utils/reactGenerator';

const DEFAULT_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dental Navbar - Inline Styles</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .group:hover .group-hover\:block { display: block; }
        .group:hover .group-hover\:visible { visibility: visible; }
        .group:hover .group-hover\:opacity-100 { opacity: 1; }
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

const TEMPLATES = [
  { label: 'Primary Button', icon: <MousePointer2 size={16} />, html: '<button style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer;">Click Me</button>' },
  { label: 'Card Container', icon: <Box size={16} />, html: '<div style="background: white; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">\n  <h3 style="margin-top:0;">Card Title</h3>\n  <p>Card content goes here.</p>\n</div>' },
  { label: 'Text Field', icon: <Type size={16} />, html: '<input type="text" placeholder="Enter text..." style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; margin-bottom: 1rem;" />' }
];

export default function App() {
  const [htmlInput, setHtmlInput] = useState(DEFAULT_HTML);
  const [docState, setDocState] = useState<ParsedDocument>({ head: '', body: [] });
  // Viewport state
  const [activeViewport, setActiveViewport] = useState<'mobile' | 'tablet' | 'desktop' | 'large'>('desktop');

  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'react'>('html');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDragging, setIsDragging] = useState(false);
  const isInternalChange = useRef(false);

  // Sync HTML String -> Tree
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    try {
      const parsed = parseHtml(htmlInput);
      setDocState(parsed);
    } catch (e) { }
  }, [htmlInput]);

  const updateTree = (newBody: Node[]) => {
    const newDoc = { ...docState, body: newBody };
    setDocState(newDoc);
    const newHtml = serializeTreeToHtml(newDoc);
    isInternalChange.current = true;
    setHtmlInput(newHtml);
  };

  const handleMoveNode = useCallback((sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
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
    updateTree(newBody);
  }, [docState]);

  // Drag Monitor for sidebar items
  useEffect(() => {
    return monitorForElements({
      onDragStart: () => setIsDragging(true),
      onDrop: ({ source }) => {
        setIsDragging(false);
        const data = source.data;
        if (data && typeof data.html === 'string') {
          const newHtml = data.html as string;
          setHtmlInput(prev => {
            isInternalChange.current = false;
            if (prev.includes('</body>')) return prev.replace('</body>', `  ${newHtml}\n</body>`);
            return prev + '\n' + newHtml;
          });
        }
      },
    });
  }, []);

  const ReactCode = generateReactCode(docState);

  // Viewport Dimensions
  const getViewportDimensions = () => {
    switch (activeViewport) {
      case 'mobile': return { width: '375px', height: '667px' };
      case 'tablet': return { width: '768px', height: '1024px' };
      case 'desktop': return { width: '1280px', height: '800px' };
      case 'large': return { width: '1440px', height: '900px' };
    }
  };
  const dims = getViewportDimensions();

  return (
    <div className={`flex flex-col h-screen bg-[#F9FAFB] text-gray-900 font-sans overflow-hidden ${isDragging ? 'cursor-grabbing' : ''}`}>

      {/* Top Navigation Bar */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shadow-sm z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-indigo-600">
            <Layout className="w-6 h-6" />
            <span>WebBuilder</span>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {/* Design Mode / Viewport Controls */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button onClick={() => setActiveViewport('mobile')} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeViewport === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
              <Smartphone size={16} /> Mobile
            </button>
            <button onClick={() => setActiveViewport('tablet')} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeViewport === 'tablet' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
              <Tablet size={16} /> Tablet
            </button>
            <button onClick={() => setActiveViewport('desktop')} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeViewport === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
              <Monitor size={16} /> Desktop
            </button>
            <button onClick={() => setActiveViewport('large')} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeViewport === 'large' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
              <Monitor size={18} /> Large
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowImportModal(true)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200 transaction-colors">
            Import HTML
          </button>
          <button onClick={() => setShowCodeModal(true)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200 transaction-colors flex items-center gap-2">
            <Code size={16} /> View Code
          </button>
          <button onClick={() => setShowPreviewModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm flex items-center gap-2">
            <Eye size={16} /> Preview
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar: Components */}
        <div className="w-[240px] border-r border-gray-200 bg-white flex flex-col flex-shrink-0 z-10">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Design Elements</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {TEMPLATES.map((t, i) => (
              <div key={i} className="mb-2">
                <DraggableTemplate label={t.label} html={t.html} icon={t.icon} />
              </div>
            ))}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-800">Drag items to the canvas to add them. You can also reorder existing elements directly on the canvas.</p>
            </div>
          </div>
        </div>

        {/* Center Canvas Area */}
        <div className="flex-1 bg-gray-50 relative overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
          <div
            className="bg-white shadow-2xl transition-all duration-500 ease-in-out relative ring-1 ring-gray-900/5"
            style={{ width: dims.width, height: dims.height }}
          >
            {/* Canvas Header/Label */}
            <div className="absolute -top-8 left-0 text-xs font-medium text-gray-400 uppercase tracking-widest">{activeViewport} {dims.width}</div>

            <InteractiveFrame
              label={activeViewport}
              width="100%"
              height="100%"
              nodes={docState.body}
              headContent={docState.head}
              onMove={handleMoveNode}
              className="w-full h-full bg-white"
            />
          </div>
        </div>

      </div>

      {/* MODAL: Import HTML */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-[800px] h-[600px] rounded-xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileCode size={18} /> Import HTML</h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 p-0 relative">
              <textarea
                className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none text-gray-700 leading-relaxed"
                value={htmlInput}
                onChange={e => setHtmlInput(e.target.value)}
                placeholder="Paste your HTML here..."
                spellCheck={false}
              />
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { setHtmlInput(DEFAULT_HTML); setShowImportModal(false); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Reset Default</button>
              <button onClick={() => setShowImportModal(false)} className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Code */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-[900px] h-[700px] rounded-xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex gap-4">
                <button onClick={() => setActiveCodeTab('html')} className={`pb-1 text-sm font-medium transition-colors border-b-2 ${activeCodeTab === 'html' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>HTML Source</button>
                <button onClick={() => setActiveCodeTab('react')} className={`pb-1 text-sm font-medium transition-colors border-b-2 ${activeCodeTab === 'react' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>React Code</button>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 bg-gray-900 overflow-auto">
              <pre className="p-6 font-mono text-sm text-gray-300">
                {activeCodeTab === 'html' ? htmlInput : ReactCode}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
              <span className="text-xs text-gray-500">Read-only view. Edit via Import Modal or Drag & Drop.</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeCodeTab === 'html' ? htmlInput : ReactCode);
                  // toast success?
                }}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 shadow-sm"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Preview Overlay */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-[90vw] h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col relative">
            <div className="h-12 bg-gray-900 flex items-center justify-between px-4">
              <h3 className="text-gray-200 font-medium text-sm">Live Preview</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const blob = new Blob([htmlInput], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open in New Tab
                </button>
                <button onClick={() => setShowPreviewModal(false)}><X size={20} className="text-gray-400 hover:text-white" /></button>
              </div>
            </div>
            <iframe
              srcDoc={htmlInput}
              className="flex-1 w-full h-full bg-white border-none"
              title="Live Preview"
            />
          </div>
        </div>
      )}

    </div>
  );
}
