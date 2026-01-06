import { useEffect, useState, useCallback, useRef } from 'react';
import { InteractiveFrame } from './components/InteractiveFrame';
import { DraggableTemplate } from './components/DraggableTemplate';
import { TreeView } from './components/TreeView';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Code, Smartphone, Tablet, Monitor, Layout, Box, Type, MousePointer2, ExternalLink, X, Eye, FileCode, Layers, Plus, Box as BoxIcon, ChevronDown, ChevronRight, PanelLeft, PanelRight, Undo, Redo } from 'lucide-react';
import { PropertiesPanel } from './components/PropertiesPanel';
import { generateReactCode } from './utils/reactGenerator';
import { HTML_DATA } from './data/htmlElements';
import { useComponentStore } from './store/useComponentStore';
import { useUIStore } from './store/useUIStore';
import { ProjectManager } from './components/ProjectManager';
import { generateAstroCode } from './utils/astroGenerator';
import { Save } from 'lucide-react';

const TEMPLATES = [
  { label: 'Primary Button', icon: <MousePointer2 size={16} />, html: '<button style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer;">Click Me</button>' },
  { label: 'Card Container', icon: <Box size={16} />, html: '<div style="background: white; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">\n  <h3 style="margin-top:0;">Card Title</h3>\n  <p>Card content goes here.</p>\n</div>' },
  { label: 'Text Field', icon: <Type size={16} />, html: '<input type="text" placeholder="Enter text..." style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; margin-bottom: 1rem;" />' }
];

const DEFAULT_HTML_RESET = `<!DOCTYPE html>
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
</html>`;

export default function App() {
  // Component Store
  const {
    docState,
    htmlInput,
    setHtmlInput,
    projectConfig,
    undo,
    redo,
    history,
    future,
  } = useComponentStore();

  // UI Store
  const {
    activeViewport,
    showImportModal,
    showCodeModal,
    activeCodeTab,
    showPreviewModal,
    sidebarTab,
    expandedCategories,
    isDragging,
    leftPanelOpen,
    rightPanelOpen,
    leftPanelWidth,
    rightPanelWidth,
    setActiveViewport,
    setShowImportModal,
    setShowCodeModal,
    setActiveCodeTab,
    setShowPreviewModal,
    setSidebarTab,
    toggleCategory,
    setIsDragging,
    toggleLeftPanel,
    toggleRightPanel,
    setLeftPanelWidth,
    setRightPanelWidth
  } = useUIStore();

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);

  const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
  const startResizingRight = useCallback(() => setIsResizingRight(true), []);
  const stopResizing = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: any) => {
    if (isResizingLeft) {
      setLeftPanelWidth(mouseMoveEvent.clientX);
    }
    if (isResizingRight) {
      setRightPanelWidth(document.body.clientWidth - mouseMoveEvent.clientX);
    }
  }, [isResizingLeft, isResizingRight, setLeftPanelWidth, setRightPanelWidth]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);



  // Drag Monitor for sidebar items
  useEffect(() => {
    return monitorForElements({
      onDragStart: () => setIsDragging(true),
      onDrop: ({ source }) => {
        setIsDragging(false);
        const data = source.data;
        if (data && typeof data.html === 'string') {
          const newHtmlContent = data.html as string;
          // Capture history directly here or rely on setHtmlInput?
          // setHtmlInput in store doesn't save history currently.
          // We SHOULD save history for drag-drop import.
          // I'll manually modify this to use a new `importHtml` action or just assume setHtmlInput handles it?
          // I decided setHtmlInput DOES NOT handle history.
          // So I should probably add history here manually?
          // Accessing store directly:
          const store = useComponentStore.getState();
          const { history, docState } = store;
          // Save history
          useComponentStore.setState({ history: [...history, docState], future: [] });

          const currentHtml = store.htmlInput;
          let nextHtml = '';
          if (currentHtml.includes('</body>')) nextHtml = currentHtml.replace('</body>', `  ${newHtmlContent}\n</body>`);
          else nextHtml = currentHtml + '\n' + newHtmlContent;
          store.setHtmlInput(nextHtml);
        }
      },
    });
  }, []);

  // Keyboard Shortcuts (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for CMD/CTRL
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const ReactCode = generateReactCode(docState);
  const AstroCode = generateAstroCode(docState);

  const handleSaveComponent = async () => {
    if (!projectConfig || !saveName) return;
    setIsSaving(true);
    try {
      const content = activeCodeTab === 'react' ? ReactCode : AstroCode; // Default to Astro if HTML?
      const type = activeCodeTab === 'react' ? 'react' : 'astro';

      const res = await fetch(`/api/projects/${projectConfig.name}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName: saveName,
          content,
          type
        })
      });

      if (res.ok) {
        setShowSaveModal(false);
        setSaveName('');
        // Maybe toast?
      } else {
        alert('Failed to save');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving component');
    } finally {
      setIsSaving(false);
    }
  };



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

          <button onClick={toggleLeftPanel} className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${!leftPanelOpen ? 'text-gray-400' : 'text-indigo-600 bg-indigo-50'}`} title="Toggle Sidebar">
            <PanelLeft size={20} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo size={18} />
            </button>
          </div>

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
          {projectConfig && (
            <div className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
              <span className="opacity-50">Project:</span>
              <span className="font-semibold">{projectConfig.name}</span>
            </div>
          )}
          <button onClick={() => setShowSaveModal(true)} disabled={!projectConfig} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors mr-1 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed" title="Save Component">
            <Save size={20} />
          </button>
          <button onClick={toggleRightPanel} className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors mr-2 ${!rightPanelOpen ? 'text-gray-400' : 'text-indigo-600 bg-indigo-50'}`} title="Toggle Properties">
            <PanelRight size={20} />
          </button>

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

        {/* Left Sidebar */}
        <div
          ref={leftSidebarRef}
          style={{ width: leftPanelOpen ? leftPanelWidth : 0 }}
          className={`border-r border-gray-200 bg-white flex flex-col flex-shrink-0 z-10 transition-all duration-300 overflow-hidden relative`}
        >
          {/* Resizer Handle */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-300 z-50 transition-colors opacity-0 hover:opacity-100"
            onMouseDown={startResizingLeft}
          />

          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSidebarTab('add')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors ${sidebarTab === 'add' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
              title="Components"
            >
              <Plus size={14} /> Add
            </button>
            <button
              onClick={() => setSidebarTab('elements')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors ${sidebarTab === 'elements' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
              title="HTML Elements"
            >
              <BoxIcon size={14} /> HTML
            </button>
            <button
              onClick={() => setSidebarTab('layers')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors ${sidebarTab === 'layers' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
              title="Layers Tree"
            >
              <Layers size={14} /> Layers
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'add' && (
              <div className="p-4 space-y-3">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preset Components</h3>
                  {TEMPLATES.map((t, i) => (
                    <div key={i} className="mb-2">
                      <DraggableTemplate label={t.label} html={t.html} icon={t.icon} />
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-blue-50 rounded text-xs text-blue-700 border border-blue-100">
                  <p>Drag items to the canvas.</p>
                </div>
              </div>
            )}

            {sidebarTab === 'elements' && (
              <div className="p-4">
                {HTML_DATA.map((category) => (
                  <div key={category.category} className="mb-4">
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="flex items-center gap-1 w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-900"
                    >
                      {expandedCategories.includes(category.category) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {category.category}
                    </button>

                    {expandedCategories.includes(category.category) && (
                      <div className="grid grid-cols-2 gap-2">
                        {category.items.map((item, i) => (
                          <DraggableTemplate
                            key={i}
                            label={item.label}
                            html={item.html}
                            icon={item.icon}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {sidebarTab === 'layers' && (
              <div className="p-2">
                <TreeView
                  nodes={docState.body}
                />
                {docState.body.length === 0 && (
                  <div className="text-center p-8 text-gray-400 text-sm">
                    No elements on canvas.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas Area */}
        <div className="flex-1 bg-gray-50 relative overflow-auto flex p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
          <div
            className="bg-white shadow-2xl transition-all duration-500 ease-in-out relative ring-1 ring-gray-900/5 m-auto"
            style={{ width: dims.width, height: dims.height }}
          >
            {/* Canvas Header/Label */}
            <div className="absolute -top-8 left-0 text-xs font-medium text-gray-400 uppercase tracking-widest">{activeViewport} {dims.width}</div>

            <InteractiveFrame
              label={activeViewport}
              width="100%"
              height="100%"
              className="w-full h-full bg-white"
            />
          </div>
        </div>

        {/* Right Properties Panel */}
        <div
          ref={rightSidebarRef}
          style={{ width: rightPanelOpen ? rightPanelWidth : 0 }}
          className={`border-l border-gray-200 bg-white flex flex-shrink-0 z-10 transition-all duration-300 overflow-hidden relative`}
        >
          {/* Resizer Handle */}
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-300 z-50 transition-colors opacity-0 hover:opacity-100"
            onMouseDown={startResizingRight}
          />

          <PropertiesPanel />
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
              <button onClick={() => { setHtmlInput(DEFAULT_HTML_RESET); setShowImportModal(false); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Reset Default</button>
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
                {/* We are hijacking the type checking slightly on activeCodeTab type (it was 'html'|'react') - but JS allows strings. We should eventually update the type in store. */}
                <button onClick={() => setActiveCodeTab('astro' as any)} className={`pb-1 text-sm font-medium transition-colors border-b-2 ${activeCodeTab === 'astro' as any ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Astro Code</button>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 bg-gray-900 overflow-auto">
              <pre className="p-6 font-mono text-sm text-gray-300">
                {activeCodeTab === 'html' ? htmlInput : (activeCodeTab === 'react' ? ReactCode : AstroCode)}
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

      {/* MODAL: Save Component */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-[400px] rounded-xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Save Component</h3>
              <button onClick={() => setShowSaveModal(false)}><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Component Name</label>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="MyComponent"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="mt-2 text-xs text-gray-500">
                Will be saved as {saveName ? saveName : 'MyComponent'}.{activeCodeTab === 'react' ? 'jsx' : 'astro'} in {projectConfig?.name}/src/components/
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSaveComponent} disabled={!saveName || isSaving} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Manager Overlay */}
      <ProjectManager />

    </div>
  );
}
