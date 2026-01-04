export interface ComponentType {
    name: string;
    category: string;
    icon: string;
    canContainChildren: boolean;
    supportsTextContent?: boolean;
    isSvg?: boolean;
}

export const COMPONENT_TYPES: Record<string, ComponentType> = {
    // Layout & Structure
    div: { name: 'Div', category: 'layout', icon: '⬜', canContainChildren: true, supportsTextContent: true },
    section: { name: 'Section', category: 'layout', icon: '📄', canContainChildren: true, supportsTextContent: true },
    article: { name: 'Article', category: 'layout', icon: '📰', canContainChildren: true, supportsTextContent: true },
    header: { name: 'Header', category: 'layout', icon: '🎯', canContainChildren: true, supportsTextContent: true },
    footer: { name: 'Footer', category: 'layout', icon: '⬇️', canContainChildren: true, supportsTextContent: true },
    nav: { name: 'Nav', category: 'layout', icon: '🧭', canContainChildren: true, supportsTextContent: true },
    main: { name: 'Main', category: 'layout', icon: '📋', canContainChildren: true, supportsTextContent: true },
    aside: { name: 'Aside', category: 'layout', icon: '➡️', canContainChildren: true, supportsTextContent: true },

    // Text Content
    h1: { name: 'H1', category: 'text', icon: 'H1', canContainChildren: false, supportsTextContent: true },
    h2: { name: 'H2', category: 'text', icon: 'H2', canContainChildren: false, supportsTextContent: true },
    h3: { name: 'H3', category: 'text', icon: 'H3', canContainChildren: false, supportsTextContent: true },
    h4: { name: 'H4', category: 'text', icon: 'H4', canContainChildren: false, supportsTextContent: true },
    p: { name: 'Paragraph', category: 'text', icon: '¶', canContainChildren: true, supportsTextContent: true },
    span: { name: 'Span', category: 'text', icon: 'S', canContainChildren: true, supportsTextContent: true },
    strong: { name: 'Strong', category: 'text', icon: 'B', canContainChildren: true, supportsTextContent: true },
    em: { name: 'Emphasis', category: 'text', icon: 'I', canContainChildren: true, supportsTextContent: true },
    a: { name: 'Link', category: 'text', icon: '🔗', canContainChildren: true, supportsTextContent: true },

    // Forms
    form: { name: 'Form', category: 'forms', icon: '📝', canContainChildren: true, supportsTextContent: true },
    input: { name: 'Input', category: 'forms', icon: '📝', canContainChildren: false, supportsTextContent: false },
    textarea: { name: 'Textarea', category: 'forms', icon: '📄', canContainChildren: false, supportsTextContent: true },
    button: { name: 'Button', category: 'forms', icon: '🔘', canContainChildren: true, supportsTextContent: true },
    select: { name: 'Select', category: 'forms', icon: '📋', canContainChildren: true, supportsTextContent: true },
    option: { name: 'Option', category: 'forms', icon: '•', canContainChildren: false, supportsTextContent: true },
    label: { name: 'Label', category: 'forms', icon: '🏷️', canContainChildren: true, supportsTextContent: true },

    // Lists
    ul: { name: 'Unordered List', category: 'lists', icon: '•', canContainChildren: true, supportsTextContent: true },
    ol: { name: 'Ordered List', category: 'lists', icon: '1.', canContainChildren: true, supportsTextContent: true },
    li: { name: 'List Item', category: 'lists', icon: '▪', canContainChildren: true, supportsTextContent: true },

    // Tables
    table: { name: 'Table', category: 'tables', icon: '📊', canContainChildren: true, supportsTextContent: true },
    thead: { name: 'Table Head', category: 'tables', icon: '⬆️', canContainChildren: true, supportsTextContent: true },
    tbody: { name: 'Table Body', category: 'tables', icon: '📄', canContainChildren: true, supportsTextContent: true },
    tr: { name: 'Table Row', category: 'tables', icon: '➡️', canContainChildren: true, supportsTextContent: true },
    th: { name: 'Table Header', category: 'tables', icon: '📤', canContainChildren: true, supportsTextContent: true },
    td: { name: 'Table Data', category: 'tables', icon: '📝', canContainChildren: true, supportsTextContent: true },

    // Media
    img: { name: 'Image', category: 'media', icon: '🖼️', canContainChildren: false },
    video: { name: 'Video', category: 'media', icon: '🎥', canContainChildren: true, supportsTextContent: true },
    audio: { name: 'Audio', category: 'media', icon: '🔊', canContainChildren: true, supportsTextContent: true },

    // SVG
    svg: { name: 'SVG', category: 'svg', icon: '🎨', canContainChildren: true, isSvg: true },
    path: { name: 'Path', category: 'svg', icon: '〰️', canContainChildren: false, isSvg: true },
    circle: { name: 'Circle', category: 'svg', icon: '⭕', canContainChildren: false, isSvg: true },
    rect: { name: 'Rectangle', category: 'svg', icon: '▭', canContainChildren: false, isSvg: true },
    line: { name: 'Line', category: 'svg', icon: '📏', canContainChildren: false, isSvg: true },
    polygon: { name: 'Polygon', category: 'svg', icon: '⬟', canContainChildren: false, isSvg: true },
    polyline: { name: 'Polyline', category: 'svg', icon: '〰️', canContainChildren: false, isSvg: true },
    ellipse: { name: 'Ellipse', category: 'svg', icon: '⬭', canContainChildren: false, isSvg: true },
    text: { name: 'Text', category: 'svg', icon: 'T', canContainChildren: true, isSvg: true },
    g: { name: 'Group', category: 'svg', icon: '📦', canContainChildren: true, isSvg: true },
};
