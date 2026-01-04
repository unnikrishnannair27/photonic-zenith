import styleToObject from 'style-to-object';
import { type Node, type ParsedDocument } from './dom';

export function generateReactCode(doc: ParsedDocument): string {
    const componentBody = doc.body.map(node => nodeToJSX(node, '    ')).join('\n');

    // Extract styles from head string
    const styleMatches = doc.head.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    const styles = styleMatches ? styleMatches.map(s => s.replace(/<\/?style[^>]*>/gi, '').trim()).join('\n\n') : '';

    const styleBlock = styles ? `
      {/* Styles from HTML head */}
      <style>
        {\`
${styles.replace(/`/g, '\\`')}
        \`}
      </style>` : '';

    return `import React from 'react';

export default function GeneratedComponent() {
  return (
    <>
${styleBlock}
${componentBody}
    </>
  );
}`;
}

function nodeToJSX(node: Node, indent: string): string {
    if (node.type === 'text') {
        const text = node.content.trim();
        if (!text) return '';
        return `${indent}${text}`;
    }

    const tagName = node.tagName;
    const props = Object.entries(node.attributes)
        .map(([key, val]) => {
            if (key === 'style') {
                try {
                    const styleObj = styleToObject(val);
                    if (!styleObj) return '';
                    // Convert to JS object string a biit hacky but works for simple cases
                    return `style={${JSON.stringify(styleObj)}}`;
                } catch (e) {
                    return '';
                }
            }
            if (key === 'class') return `className="${val}"`;
            if (key === 'for') return `htmlFor="${val}"`;

            // Handle boolean attributes usually
            if (val === '') return key;

            return `${key}="${val}"`;
        })
        .filter(Boolean)
        .join(' ');

    const selfClosing = ['img', 'input', 'br', 'hr', 'meta'].includes(tagName);

    if (selfClosing) {
        return `${indent}<${tagName} ${props} />`;
    }

    if (node.children.length === 0) {
        return `${indent}<${tagName} ${props}></${tagName}>`;
    }

    const children = node.children.map(c => nodeToJSX(c, indent + '  ')).join('\n');
    return `${indent}<${tagName} ${props}>
${children}
${indent}</${tagName}>`;
}
