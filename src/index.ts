import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { RspressPlugin } from '@rspress/core'

export interface AutoMetaPluginOptions {
  applyInProd?: boolean
  applyInDev?: boolean
  indexFirst?: boolean
  generateDirMeta?: boolean
  useFrontmatter?: boolean
  include?: RegExp[]
  exclude?: RegExp[]
  excludeDir?: (string | RegExp)[]
  filter?: (filePath: string) => boolean
  sort?: (a: string, b: string) => number
}

const defaultOptions: Required<AutoMetaPluginOptions> = {
  applyInProd: true,
  applyInDev: true,
  indexFirst: true,
  generateDirMeta: true,
  useFrontmatter: true,
  include: [/\.md$/, /\.mdx$/],
  exclude: [],
  excludeDir: [],
  filter: () => true,
  sort: (a, b) => a.localeCompare(b)
}

export function AutoMetaPlugin(
  options: AutoMetaPluginOptions = {}
): RspressPlugin {
  const opts = { ...defaultOptions, ...options }

  return {
    name: 'auto-meta-plugin',

    async beforeBuild(config, isProd) {
      if (isProd && !opts.applyInProd) return
      if (!isProd && !opts.applyInDev) return

      const docsDir = path.resolve(config.root || 'docs')
      walk(docsDir, opts)
    }
  }
}

/* ======================= 核心逻辑 ======================= */

function generateMeta(dir: string, opts: Required<AutoMetaPluginOptions>) {
  if (!fs.existsSync(dir)) return

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  // 排除目录
  if (
    opts.excludeDir.some(rule =>
      typeof rule === 'string'
        ? path.basename(dir) === rule
        : rule.test(dir)
    )
  ) {
    return
  }

  const files = entries
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(name =>
      opts.include.some(r => r.test(name)) &&
      !opts.exclude.some(r => r.test(name)) &&
      opts.filter(path.join(dir, name))
    )

  const subDirs = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name =>
      !opts.excludeDir.some(rule =>
        typeof rule === 'string'
          ? name === rule
          : rule.test(name)
      )
    )

  if (!files.length && !subDirs.length) return

  const metaPath = path.join(dir, '_meta.json')

  // 读取旧 meta 仅用于 merge 字段
  let existingMap = new Map<string, any>()
  if (fs.existsSync(metaPath)) {
    try {
      const old = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      for (const item of old) {
        if (item?.name) {
          existingMap.set(item.name, item)
        }
      }
    } catch {}
  }

  let result: any[] = []

  /* ---------- 文件排序 ---------- */

  let sortedFiles = [...files].sort(opts.sort)

  if (opts.indexFirst) {
    sortedFiles = sortedFiles.sort((a, b) =>
      a.startsWith('index') ? -1 : b.startsWith('index') ? 1 : 0
    )
  }

  /* ---------- 生成文件项 ---------- */

  for (const file of sortedFiles) {
    const name = file.replace(/\.(md|mdx)$/, '')
    let label = name

    if (opts.useFrontmatter) {
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
        const { data } = matter(raw)
        if (data.title) label = data.title
      } catch {}
    }

    const oldItem = existingMap.get(name)

    result.push({
      type: 'file',
      name,
      label: oldItem?.label ?? label
    })
  }

  /* ---------- 生成目录项 ---------- */

  if (opts.generateDirMeta) {
    const sortedDirs = [...subDirs].sort(opts.sort)

    for (const subdir of sortedDirs) {
      const oldItem = existingMap.get(subdir)

      result.push({
        type: 'dir',
        name: subdir,
        label: oldItem?.label ?? subdir,
        collapsible: oldItem?.collapsible ?? true,
        collapsed: oldItem?.collapsed ?? false
      })
    }
  }

  /* ---------- 避免无变化写入 ---------- */

  const newContent = JSON.stringify(result, null, 2)
  const oldContent = fs.existsSync(metaPath)
    ? fs.readFileSync(metaPath, 'utf-8')
    : ''

  if (newContent !== oldContent) {
    fs.writeFileSync(metaPath, newContent)
  }
}

/* ======================= 递归遍历 ======================= */

function walk(dir: string, opts: Required<AutoMetaPluginOptions>) {
  if (!fs.existsSync(dir)) return

  generateMeta(dir, opts)

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name), opts)
    }
  }
}