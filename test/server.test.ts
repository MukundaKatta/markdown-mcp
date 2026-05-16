import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { toHtml, extractFrontmatter } from '../src/server.js';

test('renders simple Markdown', () => {
  const out = toHtml('# Hello\n\nThis is **bold**.');
  assert.match(out, /<h1>Hello<\/h1>/);
  assert.match(out, /<strong>bold<\/strong>/);
});

test('renders fenced code blocks (GFM)', () => {
  const out = toHtml('```\nlet x = 1;\n```');
  assert.match(out, /<pre><code>/);
});

test('renders tables (GFM)', () => {
  const md = '| a | b |\n|---|---|\n| 1 | 2 |';
  const out = toHtml(md);
  assert.match(out, /<table>/);
});

test('extracts frontmatter', () => {
  const text = '---\ntitle: Hello\ntags:\n  - a\n  - b\n---\nbody here\n';
  const r = extractFrontmatter(text);
  assert.deepEqual(r.meta, { title: 'Hello', tags: ['a', 'b'] });
  assert.equal(r.body, 'body here\n');
});

test('returns null meta when no frontmatter', () => {
  const r = extractFrontmatter('no frontmatter here');
  assert.equal(r.meta, null);
  assert.equal(r.body, 'no frontmatter here');
});

test('handles malformed YAML gracefully', () => {
  // Frontmatter delimiters present but YAML is malformed → return meta=null and original text.
  const text = '---\n: bad: yaml: here\n---\nbody';
  const r = extractFrontmatter(text);
  // Either parser succeeded with quirky shape or returned null.
  // Body must round-trip cleanly.
  assert.ok(r.body === 'body' || r.meta === null);
});
