# rspress-plugin-auto-nav ![NPM Version](https://img.shields.io/npm/v/rspress-plugin-auto-nav)

[English](./README.md)

自动为您的文档生成导航元数据的 Rspress 插件。

此插件通过遍历您的文档目录并为每个目录生成 `_meta.json` 文件来工作，Rspress 使用这些文件进行导航。

## 使用

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

## 配置

### applyInProd

是否在生产环境中应用插件。

- Type: `boolean`
- Default: `true`

### applyInDev

是否在开发环境中应用插件。

- Type: `boolean`
- Default: `true`

### indexFirst

是否将索引文件放在导航的最前面。

- Type: `boolean`
- Default: `true`

### generateDirMeta

是否为目录生成元数据。

- Type: `boolean`
- Default: `true`

### useFrontmatter

如果可用，是否使用 frontmatter 中的标题。

- Type: `boolean`
- Default: `true`

### include

要包含的文件模式。

- Type: `RegExp[]`
- Default: `[/\.md$/, /\.mdx$/]`

### exclude

要排除的文件模式。

- Type: `RegExp[]`
- Default: `[]`

### excludeDir

要排除的目录，可以是字符串或正则表达式。

- Type: `(string | RegExp)[]`
- Default: `[]`

### filter

文件的自定义过滤函数。

- Type: `(filePath: string) => boolean`
- Default: `() => true`

### sort

文件和目录的自定义排序函数。

- Type: `(a: string, b: string) => number`
- Default: `(a, b) => a.localeCompare(b)`

## 示例配置

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