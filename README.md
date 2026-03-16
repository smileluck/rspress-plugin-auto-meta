# rspress-plugin-auto-nav

[![NPM Version](https://img.shields.io/npm/v/rspress-plugin-auto-nav)](https://www.npmjs.com/package/rspress-plugin-auto-nav)
[![NPM Downloads](https://img.shields.io/npm/dm/rspress-plugin-auto-nav)](https://www.npmjs.com/package/rspress-plugin-auto-nav)
[![License](https://img.shields.io/npm/l/rspress-plugin-auto-nav)](./LICENSE)

[简体中文](./README.zh-CN.md)

Rspress plugin to automatically generate navigation metadata for your documentation site.

## Overview

This plugin automatically traverses your documentation directory and generates `_meta.json` files for each directory, which Rspress uses to render navigation menus. It simplifies the maintenance of navigation configuration by automatically detecting document files and extracting titles from frontmatter.

## Features

- **Auto-generate `_meta.json`**: Automatically creates navigation metadata files for all directories
- **Smart title extraction**: Reads titles from Markdown frontmatter for navigation labels
- **Index file handling**: Configurable handling of `index.md` files with custom labels
- **Diff logging**: Optional detailed change logs showing what was added, removed, or modified
- **Preserve manual config**: Maintains existing `collapsible` and `collapsed` settings
- **Flexible filtering**: Support for custom filter and sort functions
- **Environment control**: Separate control for development and production modes

## Installation

```bash
# Using npm
npm i rspress-plugin-auto-nav

# Using pnpm
pnpm add rspress-plugin-auto-nav

# Using yarn
yarn add rspress-plugin-auto-nav
```

## Quick Start

```ts
import * as path from 'path';
import { defineConfig } from 'rspress/config';
import { AutoMetaPlugin } from 'rspress-plugin-auto-nav';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [AutoMetaPlugin()],
});
```

## Configuration Options

### applyInProd

Whether to apply the plugin in production environment.

- Type: `boolean`
- Default: `true`

```ts
AutoMetaPlugin({
  applyInProd: true, // Enable in production
})
```

### applyInDev

Whether to apply the plugin in development environment.

- Type: `boolean`
- Default: `true`

```ts
AutoMetaPlugin({
  applyInDev: true, // Enable in development
})
```

### index

Configuration for index.md file handling. Can be a boolean or an object.

- Type: `IndexOptions | boolean`
- Default: `{ name: '首页', first: true, rewrite: true }`

#### IndexOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| name | `string \| false` | `'首页'` | Label displayed in navigation. Set to `false` to show as "index" |
| first | `boolean` | `true` | Whether to put index files first in navigation |
| rewrite | `boolean` | `true` | Whether to overwrite user's custom label in `_meta.json` |

```ts
// Boolean usage - equivalent to { first: true, name: '首页' }
AutoMetaPlugin({
  index: true,
})

// Object usage - detailed configuration
AutoMetaPlugin({
  index: {
    name: 'Home',           // Custom label
    first: true,            // Put index first
    rewrite: false,         // Keep user's custom label
  },
})

// Disable index handling
AutoMetaPlugin({
  index: false,
})
```

### generateDirMeta

Whether to generate metadata for subdirectories.

- Type: `boolean`
- Default: `true`

```ts
AutoMetaPlugin({
  generateDirMeta: true, // Generate _meta.json for subdirectories
})
```

### useFrontmatter

Whether to use the title from frontmatter if available.

- Type: `boolean`
- Default: `true`

```ts
AutoMetaPlugin({
  useFrontmatter: true, // Use title from frontmatter as navigation label
})
```

### include

File patterns to include.

- Type: `RegExp[]`
- Default: `[/\.md$/, /\.mdx$/]`

```ts
AutoMetaPlugin({
  include: [/\.md$/, /\.mdx$/], // Include both .md and .mdx files
})
```

### exclude

File patterns to exclude.

- Type: `RegExp[]`
- Default: `[]`

```ts
AutoMetaPlugin({
  exclude: [/\.draft\.md$/, /_drafts\//], // Exclude draft files
})
```

### excludeDir

Directories to exclude, can be strings or regular expressions.

- Type: `(string | RegExp)[]`
- Default: `[]`

```ts
AutoMetaPlugin({
  excludeDir: ['_assets', 'node_modules', /^\./], // Exclude specific directories
})
```

### filter

Custom filter function for files.

- Type: `(filePath: string) => boolean`
- Default: `() => true`

```ts
AutoMetaPlugin({
  filter: (filePath) => {
    // Only process files in 'guide' directory
    return filePath.includes('guide');
  },
})
```

### sort

Custom sort function for files and directories.

- Type: `(a: string, b: string) => number`
- Default: `(a, b) => a.localeCompare(b)`

```ts
AutoMetaPlugin({
  sort: (a, b) => a.localeCompare(b), // Alphabetical sort
})

// Custom order example
AutoMetaPlugin({
  sort: (a, b) => {
    const order = ['introduction', 'installation', 'usage', 'api'];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  },
})
```

### enableDiffLog

Whether to enable detailed diff logging in console.

- Type: `boolean`
- Default: `false`

```ts
AutoMetaPlugin({
  enableDiffLog: true, // Show detailed change logs
})
```

### preserveCollapsible

Whether to preserve existing `collapsible` and `collapsed` settings in `_meta.json`.

- Type: `boolean`
- Default: `true`

```ts
AutoMetaPlugin({
  preserveCollapsible: true, // Keep user's collapsible settings
})
```

## Usage Examples

### Basic Usage

Minimal configuration with default settings:

```ts
import * as path from 'path';
import { defineConfig } from 'rspress/config';
import { AutoMetaPlugin } from 'rspress-plugin-auto-nav';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [AutoMetaPlugin()],
});
```

### Custom Index Label

Configure how index.md appears in navigation:

```ts
AutoMetaPlugin({
  index: {
    name: 'Getting Started',
    first: true,
    rewrite: true,
  },
})
```

### Advanced Filtering

Filter which files are included in navigation:

```ts
AutoMetaPlugin({
  include: [/\.md$/, /\.mdx$/],
  exclude: [/\.draft\.md$/, /private/],
  excludeDir: ['_assets', 'node_modules', '.git'],
  filter: (filePath) => {
    // Only include files that pass custom logic
    return !filePath.includes('draft') && !filePath.includes('private');
  },
  sort: (a, b) => a.localeCompare(b),
})
```

### Environment-Specific Configuration

Apply plugin only in specific environments:

```ts
AutoMetaPlugin({
  applyInProd: true,   // Enable in production
  applyInDev: false,   // Disable in development (manual control)
})
```

### Enable Debug Logging

Monitor what changes the plugin makes:

```ts
AutoMetaPlugin({
  enableDiffLog: true,
})
```

### Full Configuration Example

Comprehensive configuration with all options:

```ts
import * as path from 'path';
import { defineConfig } from 'rspress/config';
import { AutoMetaPlugin } from 'rspress-plugin-auto-nav';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [
    AutoMetaPlugin({
      // Environment control
      applyInProd: true,
      applyInDev: true,

      // Index file configuration
      index: {
        name: 'Home',
        first: true,
        rewrite: true,
      },

      // Meta generation
      generateDirMeta: true,
      useFrontmatter: true,

      // File patterns
      include: [/\.md$/, /\.mdx$/],
      exclude: [/\.draft\.md$/, /_private\//],
      excludeDir: ['_assets', 'node_modules', /\.git/],

      // Custom logic
      filter: (filePath) => !filePath.includes('draft'),
      sort: (a, b) => a.localeCompare(b),

      // Debugging
      enableDiffLog: true,
      preserveCollapsible: true,
    }),
  ],
});
```

## Type Definitions

```ts
export interface IndexOptions {
  name?: string | false
  first?: boolean
  rewrite?: boolean
}

export interface AutoMetaPluginOptions {
  applyInProd?: boolean
  applyInDev?: boolean
  index?: IndexOptions | boolean
  generateDirMeta?: boolean
  useFrontmatter?: boolean
  include?: RegExp[]
  exclude?: RegExp[]
  excludeDir?: (string | RegExp)[]
  filter?: (filePath: string) => boolean
  sort?: (a: string, b: string) => number
  enableDiffLog?: boolean
  preserveCollapsible?: boolean
}

export interface MetaItem {
  type?: 'file' | 'dir'
  name: string
  label?: string
  collapsible?: boolean
  collapsed?: boolean
}
```

## Best Practices

### 1. Use with Version Control

The generated `_meta.json` files should be committed to your repository. This ensures consistent navigation across all team members and environments.

### 2. Combine with Frontmatter

Use frontmatter in your markdown files for better navigation labels:

```markdown
---
title: Installation Guide
---

# Installation Guide

Content here...
```

### 3. Handle Draft Files

Use the `exclude` option to prevent draft files from appearing in navigation:

```ts
AutoMetaPlugin({
  exclude: [/\.draft\.md$/],
})
```

### 4. Customize Sort Order

Define a custom sort function to control navigation order:

```ts
AutoMetaPlugin({
  sort: (a, b) => {
    const order = ['intro', 'install', 'usage', 'api', 'faq'];
    return order.indexOf(a) - order.indexOf(b);
  },
})
```

### 5. Enable Diff Log for Debugging

Enable diff logging when setting up the plugin or debugging issues:

```ts
AutoMetaPlugin({
  enableDiffLog: process.env.DEBUG === 'true',
})
```

## How It Works

1. **Traversal**: The plugin recursively traverses the documentation directory
2. **File Detection**: It identifies all Markdown files matching the `include` pattern
3. **Title Extraction**: For each file, it extracts the title from frontmatter or filename
4. **Meta Generation**: It creates or updates `_meta.json` files with navigation items
5. **Preservation**: Existing configurations (like `collapsible`) are preserved when `preserveCollapsible` is enabled
6. **Diff Tracking**: When enabled, detailed logs show what changes were made

## License

MIT License - see the [LICENSE](./LICENSE) file for details.
