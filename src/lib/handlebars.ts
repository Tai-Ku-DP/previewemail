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
  const regex = /\{\{[#^/]?(\w[\w.]*)\}\}/g;
  const vars = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}
