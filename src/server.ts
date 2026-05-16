#!/usr/bin/env node
/**
 * markdown MCP server. Two tools: `to_html` and `extract_frontmatter`.
 *
 * `to_html` renders Markdown to HTML via `marked` (GFM enabled).
 * `extract_frontmatter` parses YAML frontmatter at the top of a document
 * and returns the metadata + body separately.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { marked } from 'marked';
import { parse as yamlParse } from 'yaml';

const VERSION = '0.1.0';

marked.setOptions({ gfm: true });

export function toHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

export interface FrontmatterResult {
  meta: Record<string, unknown> | null;
  body: string;
}

/**
 * Parse leading YAML frontmatter delimited by `---` lines.
 * If no frontmatter is found, returns `{ meta: null, body: text }`.
 */
export function extractFrontmatter(text: string): FrontmatterResult {
  // Frontmatter must be the very first line.
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: null, body: text };
  let meta: Record<string, unknown> | null = null;
  try {
    const parsed = yamlParse(m[1]);
    meta = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return { meta: null, body: text };
  }
  return { meta, body: m[2] };
}

const server = new Server({ name: 'markdown', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'to_html',
    description: 'Render Markdown to HTML. GFM enabled (tables, fenced code, task lists).',
    inputSchema: {
      type: 'object',
      properties: { markdown: { type: 'string' } },
      required: ['markdown'],
    },
  },
  {
    name: 'extract_frontmatter',
    description: 'Parse leading `---`-delimited YAML frontmatter and return { meta, body }.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'to_html') {
      const a = args as unknown as { markdown: string };
      return textResult(toHtml(a.markdown));
    }
    if (name === 'extract_frontmatter') {
      const a = args as unknown as { text: string };
      return jsonResult(extractFrontmatter(a.text));
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('markdown failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function textResult(text: string) {
  return { content: [{ type: 'text', text }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`markdown MCP server v${VERSION} ready on stdio\n`);
}
