import Handlebars from 'handlebars';
import type { CompileResult } from '@/types';

export function compileTemplate(
  html: string,
  data: Record<string, unknown>,
): CompileResult {
  try {
    const template = Handlebars.compile(html, { strict: false });
    return { result: template(data), error: null };
  } catch (err: unknown) {
    return {
      result: null,
      error: err instanceof Error ? err.message : 'Template compilation failed',
    };
  }
}

/**
 * Compiles a template body and wraps it in a layout.
 * The layout should contain {{{@content}}} where the template body is injected.
 * Uses Handlebars' data variables so {{{@content}}} resolves to the compiled body.
 */
export function compileWithLayout(
  templateHtml: string,
  layoutHtml: string,
  data: Record<string, unknown>,
): CompileResult {
  try {
    const bodyTemplate = Handlebars.compile(templateHtml, { strict: false });
    const compiledBody = bodyTemplate(data);

    const layoutTemplate = Handlebars.compile(layoutHtml, { strict: false });
    const result = layoutTemplate(data, {
      data: { content: compiledBody },
    });

    return { result, error: null };
  } catch (err: unknown) {
    return {
      result: null,
      error: err instanceof Error ? err.message : 'Template compilation failed',
    };
  }
}

export function compileSubject(
  subject: string,
  data: Record<string, unknown>,
): string {
  try {
    return Handlebars.compile(subject)(data);
  } catch {
    return subject;
  }
}

export function extractVariables(template: string): string[] {
  const vars = new Set<string>();

  // Helpers we don't want to treat as data variables.
  const builtInHelpers = new Set([
    'each',
    'if',
    'unless',
    'with',
    'lookup',
    'log',
  ]);

  const addPath = (p: any) => {
    const original: string | undefined = p?.original;
    if (!original) return;
    if (original === 'this') return;
    if (original.startsWith('@')) return; // @index, @root, @content, etc.
    vars.add(original);
  };

  const walk = (node: any) => {
    if (!node) return;

    // Arrays (e.g. program.body)
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }

    switch (node.type) {
      case 'Program': {
        walk(node.body);
        return;
      }

      case 'MustacheStatement': {
        // If it has params/hash, it's likely a helper invocation; treat params/hash as variables.
        const isHelperCall =
          (Array.isArray(node.params) && node.params.length > 0) ||
          (Array.isArray(node.hash?.pairs) && node.hash.pairs.length > 0) ||
          builtInHelpers.has(node.path?.original);

        if (!isHelperCall) addPath(node.path);
        walk(node.params);
        walk(node.hash);
        return;
      }

      case 'BlockStatement': {
        // {{#each todos}} -> path is "each", param[0] is PathExpression "todos"
        walk(node.params);
        walk(node.hash);
        walk(node.program);
        walk(node.inverse);
        return;
      }

      case 'PartialStatement':
      case 'PartialBlockStatement': {
        walk(node.params);
        walk(node.hash);
        walk(node.program);
        return;
      }

      case 'SubExpression': {
        walk(node.params);
        walk(node.hash);
        return;
      }

      case 'Hash': {
        walk(node.pairs);
        return;
      }

      case 'HashPair': {
        walk(node.value);
        return;
      }

      case 'PathExpression': {
        addPath(node);
        return;
      }

      default: {
        // Fall back: walk common child properties if present.
        walk(node.body);
        walk(node.program);
        walk(node.inverse);
        walk(node.params);
        walk(node.hash);
      }
    }
  };

  try {
    // Handlebars can parse full templates (HTML + moustaches).
    const ast = Handlebars.parse(template);
    walk(ast);
  } catch {
    // If parsing fails, return best-effort empty set rather than noisy results.
    return [];
  }

  return Array.from(vars);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function placeholderForPath(path: string): string {
  const parts = path.split('.').filter(Boolean);
  const leaf = parts[parts.length - 1] ?? path;
  return `${leaf}_Value`;
}

function setDeepValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) return;
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const existing = cur[key];
    if (isPlainObject(existing)) {
      cur = existing;
    } else {
      const next: Record<string, unknown> = {};
      cur[key] = next;
      cur = next;
    }
  }
  const last = parts[parts.length - 1]!;
  if (!(last in cur)) cur[last] = value;
}

function ensureArrayItem(root: Record<string, unknown>, path: string): Record<string, unknown> {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) return root;
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const existing = cur[key];
    if (isPlainObject(existing)) {
      cur = existing;
    } else {
      const next: Record<string, unknown> = {};
      cur[key] = next;
      cur = next;
    }
  }
  const last = parts[parts.length - 1]!;
  const existing = cur[last];
  if (Array.isArray(existing)) {
    if (existing.length === 0 || !isPlainObject(existing[0])) {
      existing[0] = {};
    }
    return existing[0] as Record<string, unknown>;
  }
  const arr: Record<string, unknown>[] = [{}];
  cur[last] = arr;
  return arr[0]!;
}

function ensureArrayItemInContext(
  ctx: Record<string, unknown>,
  root: Record<string, unknown>,
  path: string,
): Record<string, unknown> {
  // If the path is simple (no dots), it's relative to current context.
  // This fixes cases like {{#each todos}} inside {{#groupTodoDuedate}}: todos belongs to the group item.
  if (!path.includes('.')) {
    return ensureArrayItem(ctx, path);
  }
  // Dotted paths are also relative in Handlebars, but for our editor use-cases
  // we treat them as "set under ctx" as well.
  return ensureArrayItem(ctx, path);
}

/**
 * Builds a best-effort mock data skeleton by understanding Handlebars blocks like {{#each}}.
 * This is used for auto-fill to create nested objects/arrays that match the template structure.
 */
export function buildMockDataSkeleton(template: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  const builtInHelpers = new Set([
    'each',
    'if',
    'unless',
    'with',
    'lookup',
    'log',
  ]);

  const addVar = (ctx: Record<string, unknown>, p: any) => {
    const original: string | undefined = p?.original;
    if (!original) return;
    if (original === 'this') return;
    if (original.startsWith('@')) return;
    if (builtInHelpers.has(original)) return;
    setDeepValue(ctx, original, placeholderForPath(original));
  };

  const walk = (node: any, ctx: Record<string, unknown>) => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n, ctx);
      return;
    }

    switch (node.type) {
      case 'Program':
        walk(node.body, ctx);
        return;

      case 'MustacheStatement': {
        // For helpers, we don't want to add the helper name; but we do want to inspect params/hash.
        const isHelperCall =
          (Array.isArray(node.params) && node.params.length > 0) ||
          (Array.isArray(node.hash?.pairs) && node.hash.pairs.length > 0) ||
          builtInHelpers.has(node.path?.original);

        if (!isHelperCall) addVar(ctx, node.path);
        walk(node.params, ctx);
        walk(node.hash, ctx);
        return;
      }

      case 'BlockStatement': {
        const helper = node.path?.original;
        if (helper === 'each' && Array.isArray(node.params) && node.params[0]?.type === 'PathExpression') {
          // {{#each groupTodoDuedate}} OR {{#each .}}
          const targetPath: string = node.params[0].original;
          if (targetPath === '.' || targetPath === 'this') {
            // Iterate current context; for mock skeleton we can just walk body as-is.
            walk(node.program, ctx);
            walk(node.inverse, ctx);
            return;
          }

          const nextCtx = ensureArrayItemInContext(ctx, root, targetPath);
          walk(node.program, nextCtx);
          walk(node.inverse, ctx);
          return;
        }

        // Section blocks like {{#groupTodoDuedate}} ... {{/groupTodoDuedate}}
        // In Handlebars, if the value is an array it iterates items and sets the context to each item.
        if (
          typeof helper === 'string' &&
          helper.length > 0 &&
          !builtInHelpers.has(helper) &&
          (!Array.isArray(node.params) || node.params.length === 0)
        ) {
          const nextCtx = ensureArrayItemInContext(ctx, root, helper);
          walk(node.program, nextCtx);
          walk(node.inverse, ctx);
          return;
        }

        // Non-each block: treat params/hash as variable refs, and walk children with same ctx.
        walk(node.params, ctx);
        walk(node.hash, ctx);
        walk(node.program, ctx);
        walk(node.inverse, ctx);
        return;
      }

      case 'PathExpression':
        addVar(ctx, node);
        return;

      case 'SubExpression':
        walk(node.params, ctx);
        walk(node.hash, ctx);
        return;

      case 'Hash':
        walk(node.pairs, ctx);
        return;

      case 'HashPair':
        walk(node.value, ctx);
        return;

      default:
        walk(node.body, ctx);
        walk(node.program, ctx);
        walk(node.inverse, ctx);
        walk(node.params, ctx);
        walk(node.hash, ctx);
    }
  };

  try {
    const ast = Handlebars.parse(template);
    walk(ast, root);
    return root;
  } catch {
    return {};
  }
}
