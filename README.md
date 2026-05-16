# markdown-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/markdown-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/markdown-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

MCP server: render Markdown to HTML and split YAML frontmatter from a doc.
GFM features enabled by default (tables, fenced code, task lists).

## Tools

### `to_html`

```json
{ "markdown": "# Hello\n\nThis is **bold**." }
```

→ `"<h1>Hello</h1>\n<p>This is <strong>bold</strong>.</p>\n"`

### `extract_frontmatter`

```json
{ "text": "---\ntitle: Hello\ntags: [a, b]\n---\nbody here" }
```

→

```json
{
  "meta": { "title": "Hello", "tags": ["a", "b"] },
  "body": "body here"
}
```

When no frontmatter is present, `meta` is `null` and `body` is the input verbatim.

## Configure

```json
{ "mcpServers": { "markdown": { "command": "npx", "args": ["-y", "@mukundakatta/markdown-mcp"] } } }
```

## License

MIT.
