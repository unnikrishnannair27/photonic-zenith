import { serializeTreeToHtml } from './dom';
import type { ParsedDocument, Node } from './dom';

export const generateAstroCode = (doc: ParsedDocument): string => {
    // Determine if we should treat this as a Page or a Component.
    // Ideally user selects this.
    // For now, let's just output standard Astro format.

    // If we want to extract just the body content for a component:
    const bodyContent = extractBodyChildren(doc.body);

    return `---
// Component
// Props can be defined here
// const { title } = Astro.props;
---

${bodyContent || serializeTreeToHtml(doc)}
`;
};

const extractBodyChildren = (nodes: Node[]): string | null => {
    // Find body node
    const findBody = (list: Node[]): Node | null => {
        for (const node of list) {
            if (node.type === 'element' && node.tagName === 'body') return node;
            if (node.type === 'element' && node.children) {
                const found = findBody(node.children);
                if (found) return found;
            }
        }
        return null;
    };

    const body = findBody(nodes);
    if (!body) return null; // Fallback to full HTML if no body found

    // Now serialize children of body
    // We can't use serializeTreeToHtml directly on children list easily without a root.
    // So we'll update the serialize function to support valid HTML fragment logic if needed,
    // or just re-serialize the body and strip the tag.

    // Let's just return the full HTML for now to be safe and avoid breaking layout styles 
    // that might depend on head/body classes (like bg-gray-100).
    return null;
};
