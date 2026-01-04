import { type Node } from '../utils/dom';
import styleToObject from 'style-to-object';

export function useStyleParser(node: Node) {
    // Only relevant for elements
    if (node.type !== 'element') return undefined;

    const rawStyle = node.attributes.style;
    if (!rawStyle) return undefined;

    try {
        return styleToObject(rawStyle) || undefined;
    } catch (e) {
        return undefined;
    }
}
