import { v4 as uuidv4 } from 'uuid';

export type NodeType = 'element' | 'text';

export interface ElementNode {
    id: string;
    type: 'element';
    tagName: string;
    attributes: Record<string, string>;
    children: (ElementNode | TextNode)[];
}

export interface TextNode {
    id: string;
    type: 'text';
    content: string;
}

export type Node = ElementNode | TextNode;

export interface ParsedDocument {
    head: string; // Inner HTML of head
    body: Node[]; // Children of body
}

export function parseHtml(html: string): ParsedDocument {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract head styles and other content
    // We include script tags now to allow Tailwind CDN etc.
    const headContent = Array.from(doc.head.childNodes)
        .map(node => (node as Element).outerHTML || node.textContent)
        .join('\n');

    const bodyChildren = Array.from(doc.body.childNodes)
        .map(node => domNodeToTreeNode(node))
        .filter((n): n is Node => n !== null);

    return {
        head: headContent,
        body: bodyChildren
    };
}

function domNodeToTreeNode(domNode: globalThis.Node): Node | null {
    if (domNode.nodeType === globalThis.Node.TEXT_NODE) {
        const content = domNode.textContent;
        // Filter out pure whitespace nodes
        if (!content || !content.trim()) return null;
        return {
            id: uuidv4(),
            type: 'text',
            content: content
        };
    }

    if (domNode.nodeType === globalThis.Node.ELEMENT_NODE) {
        const el = domNode as Element;
        const attributes: Record<string, string> = {};
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            let name = attr.name;
            if (name === 'class') name = 'className';
            if (name === 'for') name = 'htmlFor';
            attributes[name] = attr.value;
        }

        // Recursively parse children
        const children = Array.from(el.childNodes)
            .map(child => domNodeToTreeNode(child))
            .filter((n): n is Node => n !== null);

        return {
            id: uuidv4(),
            type: 'element',
            tagName: el.tagName.toLowerCase(),
            attributes,
            children
        };
    }

    return null;
}

export function serializeTreeToHtml(doc: ParsedDocument): string {
    const bodyContent = doc.body.map(node => serializeNode(node)).join('\n');
    return `<!DOCTYPE html>
<html>
<head>
${doc.head}
</head>
<body>
${bodyContent}
</body>
</html>`;
}

function serializeNode(node: Node): string {
    if (node.type === 'text') return node.content;

    const attrs = Object.entries(node.attributes)
        .map(([key, val]) => {
            let name = key;
            if (name === 'className') name = 'class';
            if (name === 'htmlFor') name = 'for';
            return `${name}="${val}"`;
        })
        .join(' ');

    const children = node.children.map(serializeNode).join('');

    // Void elements
    if (['img', 'input', 'br', 'hr', 'meta'].includes(node.tagName)) {
        return `<${node.tagName}${attrs ? ' ' + attrs : ''} />`;
    }

    return `<${node.tagName}${attrs ? ' ' + attrs : ''}>${children}</${node.tagName}>`;
}

export function parseStyleString(styleString: string): Record<string, string> {
    const style: Record<string, string> = {};
    if (!styleString) return style;

    styleString.split(';').forEach(chunk => {
        const [key, ...values] = chunk.split(':');
        if (key && values.length > 0) {
            // Convert kebab-case to camelCase
            const propName = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            style[propName] = values.join(':').trim();
        }
    });

    return style;
}
