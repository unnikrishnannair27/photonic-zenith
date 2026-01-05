
const VALID_UTILITY_PATTERNS = [
    // Layout
    /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden)$/,
    /^(contents|table|table-row|table-cell|table-header-group|table-footer-group|table-row-group|table-column|table-column-group|table-caption)$/,
    /^(static|fixed|absolute|relative|sticky)$/,
    /^(visible|invisible|collapse)$/,
    /^z-(0|10|20|30|40|50|auto|\[.+\])$/,

    // Flex & Grid
    /^flex-(row|col|row-reverse|col-reverse|wrap|wrap-reverse|nowrap|1|auto|initial|none|\[.+\])$/,
    /^grid-cols-(none|subgrid|\d+|\[.+\])$/,
    /^col-(auto|span-\d+|start-\d+|end-\d+|\[.+\])$/,
    /^row-(auto|span-\d+|start-\d+|end-\d+|\[.+\])$/,
    /^gap-(x-|y-)?(\d+(\.\d+)?|px|\[.+\])$/,
    /^(justify|items|content|self|place)-(start|end|center|between|around|evenly|stretch|baseline|auto)$/,
    /^order-(\d+|first|last|none|\[.+\])$/,

    // Spacing
    /^(m|p)(t|r|b|l|x|y)?-(\d+(\.\d+)?|px|auto|\[.+\])$/,
    /^space-(x|y)-(\d+(\.\d+)?|px|reverse|\[.+\])$/,

    // Sizing
    /^(w|h)-(\d+(\.\d+)?|px|auto|full|screen|min|max|fit|\[.+\]|\d+\/\d+)$/,
    /^(min|max)-(w|h)-(\d+(\.\d+)?|px|full|screen|min|max|fit|\[.+\])$/,

    // Typography
    /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[.+\])$/,
    /^text-(transparent|current|black|white|inherit|\[.+\]|([a-z]+)-(\d+|\[.+\]))$/,
    /^font-(sans|serif|mono|thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[.+\])$/,
    /^(italic|not-italic)$/,
    /^leading-(none|tight|snug|normal|relaxed|loose|\d+|\[.+\])$/,
    /^tracking-(tighter|tight|normal|wide|wider|widest|\[.+\])$/,
    /^(underline|overline|line-through|no-underline)$/,
    /^decoration-(solid|double|dotted|dashed|wavy|\d+|\[.+\]|([a-z]+)-(\d+|\[.+\]))$/,
    /^align-(baseline|top|middle|bottom|text-top|text-bottom|sub|super)$/,
    /^(uppercase|lowercase|capitalize|normal-case)$/,
    /^truncate$/,
    /^whitespace-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)$/,
    /^break-(normal|words|all|keep)$/,

    // Backgrounds
    /^bg-(transparent|current|black|white|inherit|none|\[.+\]|([a-z]+)-(\d+|\[.+\]))$/,
    /^bg-(fixed|local|scroll)$/,
    /^bg-(bottom|center|left|left-bottom|left-top|right|right-bottom|right-top|top)$/,
    /^bg-(repeat|no-repeat|repeat-x|repeat-y|repeat-round|repeat-space)$/,
    /^bg-(cover|contain|auto)$/,

    // Borders
    /^(border|outline|ring)(-(0|2|4|8|transparent|current|black|white|inherit|\[.+\]|([a-z]+)-(\d+|\[.+\])))?$/,
    /^border-(solid|dashed|dotted|double|hidden|none)$/,
    /^rounded(-(none|sm|md|lg|xl|2xl|3xl|full|\[.+\]|(t|r|b|l|tl|tr|br|bl)(-(none|sm|md|lg|xl|2xl|3xl|full|\[.+\]))?))?$/,
    /^divide-(x|y)(-\d+|reverse|transparent|current|black|white|inherit|\[.+\]|([a-z]+)-(\d+|\[.+\]))?$/,

    // Effects
    /^shadow(-(sm|md|lg|xl|2xl|inner|none|\[.+\]))?$/,
    /^opacity-(\d+|\[.+\])$/,
    /^mix-blend-(normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity|plus-lighter)$/,
    /^blur(-(none|sm|md|lg|xl|2xl|3xl|\[.+\]))?$/,

    // Transitions & Animation
    /^transition(-(none|all|colors|opacity|shadow|transform))?$/,
    /^duration-(\d+|\[.+\])$/,
    /^delay-(\d+|\[.+\])$/,
    /^ease-(linear|in|out|in-out)$/,
    /^animate-(none|spin|ping|pulse|bounce|\[.+\])$/,

    // Transforms
    /^scale(-(x|y)-)?(\d+|\[.+\])$/,
    /^rotate-(-)?(\d+|\[.+\])$/,
    /^translate-(x|y)-(-)?(\d+(\.\d+)?|px|full|\[.+\])$/,
    /^skew-(x|y)-(-)?(\d+|\[.+\])$/,
    /^origin-(center|top|top-right|right|bottom-right|bottom|bottom-left|left|top-left|\[.+\])$/,

    // Interactivity
    /^cursor-(auto|default|pointer|wait|text|move|help|not-allowed|none|context-menu|progress|cell|crosshair|vertical-text|alias|copy|no-drop|grab|grabbing|all-scroll|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out|\[.+\])$/,
    /^select-(none|text|all|auto)$/,
    /^(pointer-events|resize)-(none|auto|both|x|y)$/,

    // SVG
    /^(fill|stroke)-(transparent|current|black|white|inherit|\[.+\]|([a-z]+)-(\d+|\[.+\]))$/,
    /^stroke-\d+$/,
];

export function validateTailwindClass(className: string): boolean {
    if (!className || typeof className !== 'string') return false;

    // Split modifiers (e.g., hover:focus:text-center)
    const parts = className.split(':');
    const utility = parts[parts.length - 1]; // Last part is the utility class

    // Check if it's a known pattern
    return VALID_UTILITY_PATTERNS.some(pattern => pattern.test(utility));
}

export function filterValidTailwindClasses(classes: string[]): string[] {
    return classes.filter(validateTailwindClass);
}
