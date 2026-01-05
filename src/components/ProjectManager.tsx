import { useEffect, useState } from 'react';
import { useComponentStore } from '../store/useComponentStore';
import { Folder, Plus, Loader2, Settings, Save } from 'lucide-react';

export const ProjectManager = () => {
    const { setProjectConfig, projectConfig } = useComponentStore();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [creating, setCreating] = useState(false);

    // Config state
    const [projectsRoot, setProjectsRoot] = useState('');
    const [isEditingRoot, setIsEditingRoot] = useState(false);

    useEffect(() => {
        fetch('/api/config')
            .then(r => r.json())
            .then(cfg => {
                if (cfg.projectsRoot) setProjectsRoot(cfg.projectsRoot);
            })
            .catch(err => console.error("Failed to fetch config", err));
    }, []);

    const saveConfig = async () => {
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectsRoot })
            });
            if (res.ok) {
                setIsEditingRoot(false);
                fetchProjects();
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        // Only fetch if no project selected
        if (!projectConfig) {
            fetchProjects();
        }
    }, [projectConfig]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/projects');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setProjects(data);
        } catch (e) {
            console.error("Failed to fetch projects (is backend running?)", e);
        } finally {
            setLoading(false);
        }
    };

    const createProject = async () => {
        if (!newProjectName) return;
        setCreating(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProjectName })
            });
            if (res.ok) {
                setNewProjectName('');
                fetchProjects();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    if (projectConfig) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Select Project</h2>
                            <p className="text-sm text-gray-500">Choose an existing Astro project or create a new one.</p>
                        </div>
                        <button
                            onClick={() => setIsEditingRoot(!isEditingRoot)}
                            className={`p-2 rounded-lg transition-colors ${isEditingRoot ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                        >
                            <Settings size={20} />
                        </button>
                    </div>

                    {isEditingRoot && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Projects Directory</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={projectsRoot}
                                    onChange={e => setProjectsRoot(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                />
                                <button
                                    onClick={saveConfig}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 flex items-center gap-1"
                                >
                                    <Save size={14} /> Update
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Enter absolute path. Projects are scanned from this folder.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex-1 overflow-y-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                            <p>Loading projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Folder size={48} className="text-gray-300 mb-2" />
                            <p>No projects found. Create one below!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.map(p => (
                                <button
                                    key={p.path}
                                    onClick={() => setProjectConfig(p)}
                                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all text-left flex items-start gap-3 group"
                                >
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                                        <Folder size={24} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-semibold text-gray-800 truncate" title={p.name}>{p.name}</div>
                                        <div className="text-xs text-gray-400 mt-1 truncate">{p.path}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Create New Project</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            placeholder="Project Name (e.g. my-astro-site)"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            onKeyDown={e => e.key === 'Enter' && createProject()}
                        />
                        <button
                            onClick={createProject}
                            disabled={creating || !newProjectName}
                            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                            {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
