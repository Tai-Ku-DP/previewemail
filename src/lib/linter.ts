import { linter, type Diagnostic } from '@codemirror/lint';

function clampPos(pos: number, max: number): number {
  return Math.max(0, Math.min(pos, max));
}

function getJsonErrorPosition(text: string, error: Error): number {
  const posMatch = error.message.match(/at position (\d+)/i);
  if (posMatch) return parseInt(posMatch[1], 10);

  const lineColMatch = error.message.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    const line = parseInt(lineColMatch[1], 10);
    const col = parseInt(lineColMatch[2], 10);
    const lines = text.split('\n');
    let offset = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      offset += lines[i].length + 1;
    }
    return offset + col - 1;
  }

  return 0;
}

export const jsonLinter = linter(
  (view) => {
    const doc = view.state.doc;
    const text = doc.toString();
    const len = doc.length;
    if (!text.trim() || len === 0) return [];

    const diagnostics: Diagnostic[] = [];

    try {
      JSON.parse(text);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const pos = getJsonErrorPosition(text, err);
        const from = clampPos(pos, len);
        const to = clampPos(from + 1, len);

        const cleanMessage = err.message
          .replace(/^JSON\.parse:\s*/i, '')
          .replace(/\s*in JSON at position \d+/i, '')
          .replace(/\s*at line \d+ column \d+.*$/i, '');

        if (from < len) {
          diagnostics.push({
            from,
            to: Math.max(to, from + 1),
            severity: 'error',
            message: cleanMessage || 'Invalid JSON',
          });
        }
      }
    }

    return diagnostics;
  },
  { delay: 500 },
);

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export const htmlLinter = linter(
  (view) => {
    const doc = view.state.doc;
    const text = doc.toString();
    const len = doc.length;
    if (!text.trim() || len === 0) return [];

    const diagnostics: Diagnostic[] = [];
    const openComments = [...text.matchAll(/<!--/g)];
    const closeComments = [...text.matchAll(/-->/g)];

    if (openComments.length > closeComments.length) {
      const last = openComments[openComments.length - 1];
      if (last && last.index + 4 <= len) {
        diagnostics.push({
          from: last.index,
          to: last.index + 4,
          severity: 'error',
          message: 'Unclosed HTML comment',
        });
      }
    }

    for (const match of text.matchAll(/<script[\s>]/gi)) {
      const from = match.index;
      const to = from + match[0].length;
      if (to <= len) {
        diagnostics.push({
          from,
          to,
          severity: 'warning',
          message: '<script> tags are blocked by most email clients',
        });
      }
    }

    const hbsStripped = text.replace(/\{\{[^}]*\}\}/g, (m) => '_'.repeat(m.length));

    const tagStack: Array<{ name: string; from: number; to: number }> = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*\/?>/g;
    let tagMatch: RegExpExecArray | null;

    while ((tagMatch = tagRegex.exec(hbsStripped)) !== null) {
      const fullMatch = tagMatch[0];
      const tagName = tagMatch[1].toLowerCase();
      const isClosing = fullMatch.startsWith('</');
      const isSelfClosing = fullMatch.endsWith('/>');

      if (VOID_ELEMENTS.has(tagName) || isSelfClosing) continue;

      const from = tagMatch.index;
      const to = from + fullMatch.length;
      if (to > len) continue;

      if (isClosing) {
        let found = false;
        for (let i = tagStack.length - 1; i >= 0; i--) {
          if (tagStack[i].name === tagName) {
            tagStack.splice(i, 1);
            found = true;
            break;
          }
        }
        if (!found) {
          diagnostics.push({
            from,
            to,
            severity: 'warning',
            message: `Unexpected closing tag </${tagName}>`,
          });
        }
      } else {
        tagStack.push({ name: tagName, from, to });
      }
    }

    for (const unclosed of tagStack) {
      if (unclosed.to <= len) {
        diagnostics.push({
          from: unclosed.from,
          to: unclosed.to,
          severity: 'warning',
          message: `Unclosed tag <${unclosed.name}>`,
        });
      }
    }

    return diagnostics;
  },
  { delay: 500 },
);
