
import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configuration
const CONFIG_FILE = path.join(__dirname, 'server-config.json');
let config = {
    projectsRoot: path.join(process.env.HOME || process.env.USERPROFILE || '/', 'AstroProjects')
};

// Load config on startup
if (fs.existsSync(CONFIG_FILE)) {
    try {
        config = fs.readJsonSync(CONFIG_FILE);
    } catch (e) {
        console.error("Failed to load config", e);
    }
}

// Ensure Projects Root exists
const getProjectsRoot = () => config.projectsRoot;
fs.ensureDirSync(getProjectsRoot());

app.use(cors());
app.use(express.json());

// 0. Config API
app.get('/api/config', (req, res) => res.json(config));
app.post('/api/config', (req, res) => {
    const { projectsRoot } = req.body;
    if (projectsRoot) {
        try {
            config.projectsRoot = projectsRoot;
            fs.ensureDirSync(projectsRoot);
            fs.writeJsonSync(CONFIG_FILE, config);
            res.json({ message: 'Config updated', config });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        res.status(400).json({ error: 'Missing projectsRoot' });
    }
});

// 1. List Projects
app.get('/api/projects', async (req, res) => {
    try {

        const root = getProjectsRoot();
        const files = await fs.readdir(root);
        const projects = [];

        for (const file of files) {
            const fullPath = path.join(root, file);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                // Check if it looks like an Astro project (has package.json, astro.config.mjs)
                const hasPackageJson = await fs.pathExists(path.join(fullPath, 'package.json'));
                if (hasPackageJson) {
                    projects.push({
                        name: file,
                        path: fullPath,
                        lastModified: stat.mtime
                    });
                }
            }
        }

        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Create Project
app.post('/api/projects', async (req, res) => {
    const { name, template = 'basics' } = req.body;

    if (!name) return res.status(400).json({ error: 'Project name is required' });

    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const root = getProjectsRoot();
    const projectPath = path.join(root, name);

    if (await fs.pathExists(projectPath)) {
        return res.status(400).json({ error: 'Project already exists' });
    }

    try {
        // Create directory
        await fs.ensureDir(projectPath);

        // Execute create-astro
        // Note: Running interactive CLI commands via exec is tricky. 
        // Better to manually scaffold or use a non-interactive flag if available.
        // For simplicity in this demo, we'll manually scaffold a basic structure 
        // or copy a template if we had one.
        // Actually, `npm create astro@latest ./ -- --template basics --yes` should work.

        console.log(`Creating project at ${projectPath}...`);

        // We need to run this command IN the new directory
        exec(`npm create astro@latest ./ -- --template ${template} --yes`, { cwd: projectPath }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                // Don't fail the request immediately if it takes time, but here we wait?
                // `exec` waits.
                return res.status(500).json({ error: error.message, details: stderr });
            }
            console.log(stdout);
            res.json({ message: 'Project created successfully', path: projectPath });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. List Components in a Project
app.get('/api/projects/:name/components', async (req, res) => {
    const { name } = req.params;
    const root = getProjectsRoot();
    const projectPath = path.join(root, name);
    const componentsPath = path.join(projectPath, 'src/components');

    try {
        if (!await fs.pathExists(componentsPath)) {
            return res.json([]);
        }

        const files = await fs.readdir(componentsPath);
        // Filter for .astro, .jsx, .tsx
        const components = files.filter(f => f.match(/\.(astro|jsx|tsx)$/));
        res.json(components);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Create/Save Component
app.post('/api/projects/:name/components', async (req, res) => {
    const { name } = req.params;
    const { componentName, content, type = 'astro' } = req.body;

    const root = getProjectsRoot();
    const projectPath = path.join(root, name);
    const componentsPath = path.join(projectPath, 'src/components');
    const extension = type === 'react' ? '.jsx' : '.astro'; // or .tsx
    const fileName = componentName.endsWith(extension) ? componentName : `${componentName}${extension}`;
    const filePath = path.join(componentsPath, fileName);

    try {
        await fs.ensureDir(componentsPath);
        await fs.writeFile(filePath, content);
        res.json({ message: 'Component saved', path: filePath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Projects Root: ${getProjectsRoot()}`);
});
