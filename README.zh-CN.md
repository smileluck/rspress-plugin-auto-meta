# rspress-plugin-auto-nav

[![NPM Version](https://img.shields.io/npm/v/rspress-plugin-auto-nav)](https://www.npmjs.com/package/rspress-plugin-auto-nav)
[![NPM Downloads](https://img.shields.io/npm/dm/rspress-plugin-auto-nav)](https://www.npmjs.com/package/rspress-plugin-auto-nav)
[![License](https://img.shields.io/npm/l/rspress-plugin-auto-nav)](./LICENSE)

[English](./README.md)

自动为 Rspress 文档站点生成导航元数据的插件。

## 概述

该插件会自动遍历您的文档目录并为每个目录生成 `_meta.json` 文件，Rspress 使用这些文件来渲染导航菜单。它通过自动检测文档文件并从 frontmatter 中提取标题来简化导航配置的管理。

## 功能特性

- **自动生成 `_meta.json`**：为所有目录自动创建导航元数据文件
- **智能标题提取**：从 Markdown frontmatter 中读取标题作为导航标签
- **索引文件处理**：可配置处理 `index.md` 文件，支持自定义标签
- **差异日志**：可选的详细变更日志，显示新增、移除或修改的内容
- **保留手动配置**：保留现有的 `collapsible` 和 `collapsed` 设置
- **灵活过滤**：支持自定义过滤和排序函数
- **环境控制**：分别控制开发和生产模式
- **根目录排除**：支持排除根目录的元数据生成

## 安装

```bash
# 使用 npm
npm i rspress-plugin-auto-nav

# 使用 pnpm
pnpm add rspress-plugin-auto-nav

# 使用 yarn
yarn add rspress-plugin-auto-nav
```

## 快速开始

```ts
import * as path from 'path';
import { defineConfig } from 'rspress/config';
import { AutoMetaPlugin } from 'rspress-plugin-auto-nav';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [AutoMetaPlugin()],
});
```

## 配置选项

### applyInProd

是否在生产环境中应用插件。

- 类型：`boolean`
- 默认值：`true`

```ts
AutoMetaPlugin({
  applyInProd: true, // 在生产环境启用
})
```

### applyInDev

是否在开发环境中应用插件。

- 类型：`boolean`
- 默认值：`true`

```ts
AutoMetaPlugin({
  applyInDev: true, // 在开发环境启用
})
```

### excludeRoot

是否排除 config.root 指定的根目录，不生成 `_meta.json` 文件。

- 类型：`boolean`
- 默认值：`true`

```ts
AutoMetaPlugin({
  excludeRoot: true, // 排除根目录的元数据生成
})
```

### index

索引文件处理配置。可以是布尔值或对象。

- 类型：`IndexOptions | boolean`
- 默认值：`{ name: '首页', first: true, rewrite: true }`

#### IndexOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| name | `string \| false` | `'首页'` | 导航中显示的标签。设置为 `false` 时显示为 "index" |
| first | `boolean` | `true` | 是否将索引文件放在导航最前面 |
| rewrite | `boolean` | `true` | 是否覆盖用户在 `_meta.json` 中自定义的标签 |

```ts
// 布尔值用法 - 等同于 { first: true, name: '首页' }
AutoMetaPlugin({
  index: true,
})

// 对象用法 - 详细配置
AutoMetaPlugin({
  index: {
    name: '首页',        // 自定义标签
    first: true,        // 索引文件置顶
    rewrite: false,     // 保留用户自定义标签
  },
})

// 禁用索引文件处理
AutoMetaPlugin({
  index: false,
})
```

### generateDirMeta

是否为子目录生成元数据。

- 类型：`boolean`
- 默认值：`true`

```ts
AutoMetaPlugin({
  generateDirMeta: true, // 为子目录生成 _meta.json
})
```

### useFrontmatter

如果可用，是否使用 frontmatter 中的标题。

- 类型：`boolean`
- 默认值：`true`

```ts
AutoMetaPlugin({
  useFrontmatter: true, // 使用 frontmatter 中的标题作为导航标签
})
```

### include

要包含的文件模式。

- 类型：`RegExp[]`
- 默认值：`[/\.md$/, /\.mdx$/]`

```ts
AutoMetaPlugin({
  include: [/\.md$/, /\.mdx$/], // 包含 .md 和 .mdx 文件
})
```

### exclude

要排除的文件模式。

- 类型：`RegExp[]`
- 默认值：`[]`

```ts
AutoMetaPlugin({
  exclude: [/\.draft\.md$/, /_drafts\//], // 排除草稿文件
})
```

### excludeDir

要排除的目录，可以是字符串或正则表达式。

- 类型：`(string | RegExp)[]`
- 默认值：`[]`

```ts
AutoMetaPlugin({
  excludeDir: ['_assets', 'node_modules', /^\./], // 排除指定目录
})
```

### filter

文件的自定义过滤函数。

- 类型：`(filePath: string) => boolean`
- 默认值：`() => true`

```ts
AutoMetaPlugin({
  filter: (filePath) => {
    // 仅处理 'guide' 目录下的文件
    return filePath.includes('guide');
  },
})
```

### sort

文件和目录的自定义排序函数。

- 类型：`(a: string, b: string) => number`
- 默认值：`(a, b) => a.localeCompare(b)`

```ts
AutoMetaPlugin({
  sort: (a, b) => a.localeCompare(b), // 按字母顺序排序
})

// 自定义顺序示例
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

是否在控制台启用详细差异日志。

- 类型：`boolean`
- 默认值：`false`

```ts
AutoMetaPlugin({
  enableDiffLog: true, // 显示详细变更日志
})
```

### preserveCollapsible

是否保留 `_meta.json` 中现有的 `collapsible` 和 `collapsed` 设置。

- 类型：`boolean`
- 默认值：`true`

```ts
AutoMetaPlugin({
  preserveCollapsible: true, // 保留用户的折叠设置
})
```

## 使用示例

### 基础用法

使用默认配置的最小化配置：

```ts
import * as path from 'path';
import { defineConfig } from 'rspress/config';
import { AutoMetaPlugin } from 'rspress-plugin-auto-nav';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [AutoMetaPlugin()],
});
```

### 自定义索引标签

配置 `index.md` 在导航中的显示方式：

```ts
AutoMetaPlugin({
  index: {
    name: '快速开始',
    first: true,
    rewrite: true,
  },
})
```

### 高级过滤

过滤哪些文件包含在导航中：

```ts
AutoMetaPlugin({
  include: [/\.md$/, /\.mdx$/],
  exclude: [/\.draft\.md$/, /private/],
  excludeDir: ['_assets', 'node_modules', '.git'],
  filter: (filePath) => {
    // 仅包含通过自定义逻辑的文件
    return !filePath.includes('draft') && !filePath.includes('private');
  },
  sort: (a, b) => a.localeCompare(b),
})
```

### 环境特定配置

仅在特定环境中应用插件：

```ts
AutoMetaPlugin({
  applyInProd: true,   // 在生产环境启用
  applyInDev: false,  // 在开发环境禁用（手动控制）
})
```

### 启用调试日志

监控插件所做的更改：

```ts
AutoMetaPlugin({
  enableDiffLog: true,
})
```

### 完整配置示例

包含所有选项的完整配置：

```ts
import * as path from 'path';
import { defineConfig } from 'rspress/config';
import { AutoMetaPlugin } from 'rspress-plugin-auto-nav';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [
    AutoMetaPlugin({
      // 环境控制
      applyInProd: true,
      applyInDev: true,

      // 根目录控制
      excludeRoot: true,

      // 索引文件配置
      index: {
        name: '首页',
        first: true,
        rewrite: true,
      },

      // 元数据生成
      generateDirMeta: true,
      useFrontmatter: true,

      // 文件匹配模式
      include: [/\.md$/, /\.mdx$/],
      exclude: [/\.draft\.md$/, /_private\//],
      excludeDir: ['_assets', 'node_modules', /\.git/],

      // 自定义逻辑
      filter: (filePath) => !filePath.includes('draft'),
      sort: (a, b) => a.localeCompare(b),

      // 调试
      enableDiffLog: true,
      preserveCollapsible: true,
    }),
  ],
});
```

## 类型定义

```ts
export interface IndexOptions {
  name?: string | false
  first?: boolean
  rewrite?: boolean
}

export interface AutoMetaPluginOptions {
  applyInProd?: boolean
  applyInDev?: boolean
  excludeRoot?: boolean
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
  order?: number
  collapsible?: boolean
  collapsed?: boolean
}
```

## 最佳实践

### 1. 配合版本控制使用

生成的 `_meta.json` 文件应该提交到您的代码仓库。这确保所有团队成员和环境中的导航配置一致。

### 2. 结合 Frontmatter 使用

在 Markdown 文件中使用 frontmatter 以获得更好的导航标签：

```markdown
---
title: 安装指南
---

# 安装指南

内容...
```

### 3. 处理草稿文件

使用 `exclude` 选项防止草稿文件出现在导航中：

```ts
AutoMetaPlugin({
  exclude: [/\.draft\.md$/],
})
```

### 4. 自定义排序顺序

定义自定义排序函数来控制导航顺序：

```ts
AutoMetaPlugin({
  sort: (a, b) => {
    const order = ['intro', 'install', 'usage', 'api', 'faq'];
    return order.indexOf(a) - order.indexOf(b);
  },
})
```

### 5. 启用差异日志进行调试

在设置插件或调试问题时启用差异日志：

```ts
AutoMetaPlugin({
  enableDiffLog: process.env.DEBUG === 'true',
})
```

## 工作原理

1. **遍历**：插件递归遍历文档目录
2. **文件检测**：识别所有与 `include` 模式匹配的 Markdown 文件
3. **标题提取**：从 frontmatter 或文件名中提取每个文件的标题
4. **元数据生成**：使用导航项创建或更新 `_meta.json` 文件
5. **配置保留**：当启用 `preserveCollapsible` 时，保留现有配置（如 `collapsible`）
6. **差异跟踪**：启用时，详细日志显示所做的更改

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交您的更改（`git commit -m 'feat: 添加新功能'`）
4. 推送分支（`git push origin feature/amazing-feature`）
5. 提交 Pull Request

请确保适当更新测试。

## 故障排除

### 导航没有显示

如果导航没有显示，请确保：
- 插件已正确注册在 `rspress.config.ts` 中
- 您的 Markdown 文件在正确的目录结构中
- `_meta.json` 文件正在被生成（使用 `enableDiffLog: true` 检查）

### 索引文件没有显示

检查您的 `index` 配置：
- 设置 `index: true` 以启用索引文件处理
- 验证 `name` 属性设置正确
- 如果希望索引文件显示在最前面，请确保 `first: true`

### 文件没有被包含

验证您的过滤模式：
- 检查 `include` 模式是否匹配您的文件扩展名
- 确保文件没有被 `exclude` 或 `excludeDir` 排除
- 确保 `filter` 函数对您的文件返回 `true`

### 更改没有生效

如果更改没有生效：
- 清除 `.rspress` 缓存目录
- 重新运行构建
- 检查 `enableDiffLog` 查看正在生成的内容

### TypeScript 错误

如果您遇到 TypeScript 错误：
- 确保已安装 `@rspress/core` 作为 peer dependency
- 更新 TypeScript 到最新的稳定版本
- 检查您的 `tsconfig.json` 是否包含插件类型

## 许可证

MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件。
