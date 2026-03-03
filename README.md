# rspress-plugin-auto-nav ![NPM Version](https://img.shields.io/npm/v/rspress-plugin-auto-nav)

[简体中文](./README.zh-CN.md)

Rspress plugin to automatically generate navigation metadata for your documentation.

This plugin works by traversing your documentation directory and generating `_meta.json` files for each directory, which Rspress uses for navigation.

## Usage

```bash
npm i rspress-plugin-auto-nav
pnpm add rspress-plugin-auto-nav
```

```ts
import * as path from 'path';
import { defineConfig } from 'rspress/config';
import { AutoMetaPlugin } from 'rspress-plugin-auto-nav';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [AutoMetaPlugin({
    excludeDir: ['_assets'],
  })],
});
```

## Configure

### applyInProd

Whether to apply the plugin in production environment.

- Type: `boolean`
- Default: `true`

### applyInDev

Whether to apply the plugin in development environment.

- Type: `boolean`
- Default: `true`

### indexFirst

Whether to put index files first in the navigation.

- Type: `boolean`
- Default: `true`

### generateDirMeta

Whether to generate metadata for directories.

- Type: `boolean`
- Default: `true`

### useFrontmatter

Whether to use the title from frontmatter if available.

- Type: `boolean`
- Default: `true`

### include

File patterns to include.

- Type: `RegExp[]`
- Default: `[/\.md$/, /\.mdx$/]`

### exclude

File patterns to exclude.

- Type: `RegExp[]`
- Default: `[]`

### excludeDir

Directories to exclude, can be strings or regular expressions.

- Type: `(string | RegExp)[]`
- Default: `[]`

### filter

Custom filter function for files.

- Type: `(filePath: string) => boolean`
- Default: `() => true`

### sort

Custom sort function for files and directories.

- Type: `(a: string, b: string) => number`
- Default: `(a, b) => a.localeCompare(b)`

## Example Configuration

```ts
import * as path from 'path';
import { defineConfig } from 'rspress/config';
import { AutoMetaPlugin } from 'rspress-plugin-auto-nav';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [
    AutoMetaPlugin({
      applyInProd: true,
      applyInDev: true,
      indexFirst: true,
      generateDirMeta: true,
      useFrontmatter: true,
      include: [/\.md$/, /\.mdx$/],
      exclude: [/\.draft\.md$/],
      excludeDir: ['_assets', 'node_modules'],
      filter: (filePath) => filePath.includes('guide'),
      sort: (a, b) => a.localeCompare(b),
    }),
  ],
});
```