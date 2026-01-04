import {
    Box, Type, Image, Link, Layout, Square, Table, List,
    Heading1, Heading2, Heading3, Quote, Code, CheckSquare,
    Video, Music, Minus, FormInput, FileText, ToggleLeft
} from 'lucide-react';

export const HTML_DATA = [
    {
        category: 'Structure',
        items: [
            { label: 'Div', tag: 'div', icon: <Box size={16} />, html: '<div>Div Block</div>' },
            { label: 'Section', tag: 'section', icon: <Layout size={16} />, html: '<section style="padding: 20px;">Section</section>' },
            { label: 'Container', tag: 'div', icon: <Box size={16} />, html: '<div style="max-width: 1200px; margin: 0 auto; padding: 20px;">Container</div>' },
            { label: 'Header', tag: 'header', icon: <Layout size={16} />, html: '<header style="padding: 20px; background: #f3f4f6;">Header</header>' },
            { label: 'Footer', tag: 'footer', icon: <Layout size={16} />, html: '<footer style="padding: 20px; background: #1f2937; color: white;">Footer</footer>' },
            { label: 'Main', tag: 'main', icon: <Layout size={16} />, html: '<main style="padding: 20px;">Main Content</main>' },
            { label: 'Nav', tag: 'nav', icon: <Layout size={16} />, html: '<nav style="display: flex; gap: 10px; padding: 10px;">Nav</nav>' },
            { label: 'Aside', tag: 'aside', icon: <Layout size={16} />, html: '<aside style="width: 200px; padding: 10px; border-left: 1px solid #ccc;">Aside</aside>' },
        ]
    },
    {
        category: 'Typography',
        items: [
            { label: 'Heading 1', tag: 'h1', icon: <Heading1 size={16} />, html: '<h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem;">Heading 1</h1>' },
            { label: 'Heading 2', tag: 'h2', icon: <Heading2 size={16} />, html: '<h2 style="font-size: 2rem; font-weight: bold; margin-bottom: 0.75rem;">Heading 2</h2>' },
            { label: 'Heading 3', tag: 'h3', icon: <Heading3 size={16} />, html: '<h3 style="font-size: 1.75rem; font-weight: bold; margin-bottom: 0.5rem;">Heading 3</h3>' },
            { label: 'Paragraph', tag: 'p', icon: <Type size={16} />, html: '<p style="margin-bottom: 1rem; line-height: 1.5;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>' },
            { label: 'Link', tag: 'a', icon: <Link size={16} />, html: '<a href="#" style="color: #3b82f6; text-decoration: underline;">Link Text</a>' },
            { label: 'Blockquote', tag: 'blockquote', icon: <Quote size={16} />, html: '<blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; font-style: italic;">Blockquote text...</blockquote>' },
            { label: 'Code Block', tag: 'pre', icon: <Code size={16} />, html: '<pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;"><code>console.log("Hello World");</code></pre>' },
            { label: 'Span', tag: 'span', icon: <Type size={16} />, html: '<span>Span Text</span>' },
        ]
    },
    {
        category: 'Media',
        items: [
            { label: 'Image', tag: 'img', icon: <Image size={16} />, html: '<img src="https://via.placeholder.com/300x200" alt="Placeholder" style="max-width: 100%; height: auto; border-radius: 0.5rem;" />' },
            { label: 'Video', tag: 'video', icon: <Video size={16} />, html: '<video controls style="width: 100%; border-radius: 0.5rem;"><source src="movie.mp4" type="video/mp4">Your browser does not support the video tag.</video>' },
            { label: 'Audio', tag: 'audio', icon: <Music size={16} />, html: '<audio controls style="width: 100%;"><source src="audio.mp3" type="audio/mpeg">Your browser does not support the audio element.</audio>' },
        ]
    },
    {
        category: 'Forms',
        items: [
            { label: 'Input', tag: 'input', icon: <FormInput size={16} />, html: '<input type="text" placeholder="Input..." style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;" />' },
            { label: 'Textarea', tag: 'textarea', icon: <FileText size={16} />, html: '<textarea placeholder="Text area..." style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem; width: 100%; min-height: 100px;"></textarea>' },
            { label: 'Checkbox', tag: 'input', icon: <CheckSquare size={16} />, html: '<div style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="check" /><label for="check">Checkbox</label></div>' },
            { label: 'Button', tag: 'button', icon: <Square size={16} />, html: '<button style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">Button</button>' },
            { label: 'Label', tag: 'label', icon: <Type size={16} />, html: '<label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Label</label>' },
            { label: 'Select', tag: 'select', icon: <ToggleLeft size={16} />, html: '<select style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;"><option>Option 1</option><option>Option 2</option></select>' },
        ]
    },
    {
        category: 'Lists',
        items: [
            { label: 'Unordered List', tag: 'ul', icon: <List size={16} />, html: '<ul style="list-style-type: disc; padding-left: 1.5rem;"><li>List item 1</li><li>List item 2</li></ul>' },
            { label: 'Ordered List', tag: 'ol', icon: <List size={16} />, html: '<ol style="list-style-type: decimal; padding-left: 1.5rem;"><li>Item 1</li><li>Item 2</li></ol>' },
        ]
    },
    {
        category: 'Other',
        items: [
            { label: 'Horizontal Rule', tag: 'hr', icon: <Minus size={16} />, html: '<hr style="margin: 2rem 0; border: 0; border-top: 1px solid #e5e7eb;" />' },
            { label: 'Table', tag: 'table', icon: <Table size={16} />, html: '<table style="width: 100%; border-collapse: collapse;"><thead style="background: #f3f4f6;"><tr><th style="padding: 0.5rem; border: 1px solid #e5e7eb;">Header 1</th><th style="padding: 0.5rem; border: 1px solid #e5e7eb;">Header 2</th></tr></thead><tbody><tr><td style="padding: 0.5rem; border: 1px solid #e5e7eb;">Call 1</td><td style="padding: 0.5rem; border: 1px solid #e5e7eb;">Cell 2</td></tr></tbody></table>' },
        ]
    }
];
