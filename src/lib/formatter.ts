import * as prettier from 'prettier/standalone';
import htmlPlugin from 'prettier/plugins/html';

export async function formatHtml(code: string): Promise<string> {
  const formatted = await prettier.format(code, {
    parser: 'html',
    plugins: [htmlPlugin],
    printWidth: 120,
    tabWidth: 2,
    useTabs: false,
    singleQuote: false,
    htmlWhitespaceSensitivity: 'ignore',
  });
  return formatted;
}

export function formatJson(code: string): string {
  const parsed: unknown = JSON.parse(code);
  return JSON.stringify(parsed, null, 2);
}
