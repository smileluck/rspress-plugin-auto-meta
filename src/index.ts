import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { RspressPlugin } from '@rspress/core'

/**
 * index 配置选项
 */
export interface IndexOptions {
  /**
   * 控制 index.md 文件在生成的 _meta.json 中的标签显示
   * - 设置为 false 时，标签显示为 "index"
   * - 设置为字符串时，标签显示为该字符串
   * - 未配置时，默认显示为 "首页"
   */
  name?: string | false

  /**
   * 控制 index.md 文件是否排在最前面
   * 当设置为 true 时，index 文件会优先显示
   */
  first?: boolean

  /**
   * 是否覆盖用户在 _meta.json 中手动配置的 label
   * - 设置为 true 时，会用 name 配置的值覆盖用户自定义的 label
   * - 设置为 false 时，保留用户自定义的 label
   * - 未配置时，默认为 true
   */
  rewrite?: boolean
}

/**
 * 自动生成 Rspress 项目中 _meta.json 文件的插件
 * 用于自动化管理文档目录的导航配置
 */
export interface AutoMetaPluginOptions {
  /**
   * 是否在生产环境启用插件
   * 默认为 true
   */
  applyInProd?: boolean

  /**
   * 是否在开发环境启用插件
   * 默认为 true
   */
  applyInDev?: boolean

  /**
   * index 文件配置
   * - 配置为 boolean 时，true 等同于 { first: true, name: '首页' }
   * - 配置为对象时，可同时设置 name、first 和 rewrite 属性
   */
  index?: IndexOptions | boolean

  /**
   * 是否自动生成目录的 _meta.json 文件
   * 默认为 true
   */
  generateDirMeta?: boolean

  /**
   * 是否从 Markdown 文件的 frontmatter 中读取 title 作为导航标签
   * 默认为 true
   */
  useFrontmatter?: boolean

  /**
   * 需要处理的文件匹配正则表达式数组
   * 默认为 [/\.md$/, /\.mdx$/]
   */
  include?: RegExp[]

  /**
   * 需要排除的文件匹配正则表达式数组
   */
  exclude?: RegExp[]

  /**
   * 需要排除的目录名称或正则表达式数组
   */
  excludeDir?: (string | RegExp)[]

  /**
   * 自定义过滤器函数，用于判断是否处理某个文件
   */
  filter?: (filePath: string) => boolean

  /**
   * 自定义排序函数，用于对文件/目录进行排序
   */
  sort?: (a: string, b: string) => number

  /**
   * 是否启用差异更新日志
   * 启用后会在控制台输出详细的差异信息
   * 默认为 false
   */
  enableDiffLog?: boolean

  /**
   * 是否保留原有的 collapsible 和 collapsed 配置
   * 默认为 true
   */
  preserveCollapsible?: boolean
}

/**
 * Meta 条目类型
 */
export interface MetaItem {
  type?: 'file' | 'dir'
  name: string
  label?: string
  collapsible?: boolean
  collapsed?: boolean
}

/**
 * 差异报告类型
 */
export interface DiffReport {
  added: MetaItem[]
  removed: MetaItem[]
  modified: Array<{
    item: MetaItem
    oldItem: MetaItem
    changes: string[]
  }>
  unchanged: MetaItem[]
  timestamp: string
  filePath: string
}

/**
 * 更新日志类型
 */
export interface UpdateLog {
  timestamp: string
  filePath: string
  summary: {
    total: number
    added: number
    removed: number
    modified: number
    unchanged: number
  }
  details: Array<{
    type: 'add' | 'remove' | 'modify' | 'unchanged'
    name: string
    description: string
  }>
}

const defaultOptions: Required<Omit<AutoMetaPluginOptions, 'index'>> & { index: Required<IndexOptions> } = {
  applyInProd: true,
  applyInDev: true,
  index: {
    name: '首页',
    first: true,
    rewrite: true
  },
  generateDirMeta: true,
  useFrontmatter: true,
  include: [/\.md$/, /\.mdx$/],
  exclude: [],
  excludeDir: [],
  filter: () => true,
  sort: (a, b) => a.localeCompare(b),
  enableDiffLog: false,
  preserveCollapsible: true
}

/**
 * 创建 AutoMeta 插件实例
 * @param options - 插件配置选项
 * @returns Rspress 插件对象
 */
export function AutoMetaPlugin(
  options: AutoMetaPluginOptions = {}
): RspressPlugin {
  const opts = { ...defaultOptions, ...options }

  // 处理 index 配置
  if (options.index !== undefined) {
    if (typeof options.index === 'boolean') {
      opts.index = {
        name: '首页',
        first: options.index,
        rewrite: true
      }
    } else {
      opts.index = {
        name: options.index.name !== undefined ? options.index.name : '首页',
        first: options.index.first !== undefined ? options.index.first : true,
        rewrite: options.index.rewrite !== undefined ? options.index.rewrite : true
      }
    }
  }

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

/**
 * 验证 Meta 条目的格式正确性和完整性
 * @param items Meta 条目数组
 * @returns 验证结果和错误信息
 */
function validateMetaStructure(items: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Array.isArray(items)) {
    errors.push('Meta 数据必须是数组类型')
    return { valid: false, errors }
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    if (!item || typeof item !== 'object') {
      errors.push(`索引 ${i}: 条目必须是对象类型`)
      continue
    }

    if (!item.name || typeof item.name !== 'string') {
      errors.push(`索引 ${i}: 条目必须包含 name 字段且为字符串`)
    }

    if (item.type && !['file', 'dir'].includes(item.type)) {
      errors.push(`索引 ${i}: type 必须是 'file' 或 'dir'`)
    }

    if (item.collapsible !== undefined && typeof item.collapsible !== 'boolean') {
      errors.push(`索引 ${i}: collapsible 必须是布尔值`)
    }

    if (item.collapsed !== undefined && typeof item.collapsed !== 'boolean') {
      errors.push(`索引 ${i}: collapsed 必须是布尔值`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 对比新旧 Meta 结构，生成详细的差异报告
 * @param newItems 新的 Meta 条目
 * @param oldItems 旧的 Meta 条目
 * @param filePath 文件路径（用于报告）
 * @returns 差异报告
 */
function generateDiffReport(newItems: MetaItem[], oldItems: MetaItem[], filePath: string): DiffReport {
  const oldMap = new Map<string, MetaItem>()
  for (const item of oldItems) {
    oldMap.set(item.name, item)
  }

  const newMap = new Map<string, MetaItem>()
  for (const item of newItems) {
    newMap.set(item.name, item)
  }

  const report: DiffReport = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
    timestamp: new Date().toISOString(),
    filePath
  }

  for (const newItem of newItems) {
    const oldItem = oldMap.get(newItem.name)
    
    if (!oldItem) {
      report.added.push(newItem)
    } else {
      const changes: string[] = []
      
      if (newItem.label !== oldItem.label) {
        changes.push(`label: "${oldItem.label}" -> "${newItem.label}"`)
      }
      if (newItem.type !== oldItem.type) {
        changes.push(`type: "${oldItem.type}" -> "${newItem.type}"`)
      }
      if (newItem.collapsible !== oldItem.collapsible) {
        changes.push(`collapsible: ${oldItem.collapsible} -> ${newItem.collapsible}`)
      }
      if (newItem.collapsed !== oldItem.collapsed) {
        changes.push(`collapsed: ${oldItem.collapsed} -> ${newItem.collapsed}`)
      }

      if (changes.length > 0) {
        report.modified.push({ item: newItem, oldItem, changes })
      } else {
        report.unchanged.push(newItem)
      }
    }
  }

  for (const oldItem of oldItems) {
    if (!newMap.has(oldItem.name)) {
      report.removed.push(oldItem)
    }
  }

  return report
}

/**
 * 生成更新日志
 * @param report 差异报告
 * @returns 更新日志
 */
function generateUpdateLog(report: DiffReport): UpdateLog {
  const details: UpdateLog['details'] = []

  for (const item of report.added) {
    details.push({
      type: 'add',
      name: item.name,
      description: `新增条目: ${item.name} (type: ${item.type || 'file'})`
    })
  }

  for (const item of report.removed) {
    details.push({
      type: 'remove',
      name: item.name,
      description: `移除条目: ${item.name}`
    })
  }

  for (const mod of report.modified) {
    details.push({
      type: 'modify',
      name: mod.item.name,
      description: `修改条目: ${mod.item.name}, 变更: ${mod.changes.join('; ')}`
    })
  }

  for (const item of report.unchanged) {
    details.push({
      type: 'unchanged',
      name: item.name,
      description: `未变更: ${item.name}`
    })
  }

  const total = report.added.length + report.removed.length + report.modified.length + report.unchanged.length

  return {
    timestamp: report.timestamp,
    filePath: report.filePath,
    summary: {
      total,
      added: report.added.length,
      removed: report.removed.length,
      modified: report.modified.length,
      unchanged: report.unchanged.length
    },
    details
  }
}

/**
 * 输出差异日志到控制台
 * @param report 差异报告
 */
function logDiffReport(report: DiffReport): void {
  console.log('\n========== Meta 差异报告 ==========')
  console.log(`文件: ${report.filePath}`)
  console.log(`时间: ${report.timestamp}`)
  console.log('-----------------------------------')

  if (report.added.length > 0) {
    console.log(`\n[新增] ${report.added.length} 项:`)
    for (const item of report.added) {
      console.log(`  + ${item.name} (label: ${item.label}, type: ${item.type || 'file'})`)
    }
  }

  if (report.removed.length > 0) {
    console.log(`\n[移除] ${report.removed.length} 项:`)
    for (const item of report.removed) {
      console.log(`  - ${item.name}`)
    }
  }

  if (report.modified.length > 0) {
    console.log(`\n[修改] ${report.modified.length} 项:`)
    for (const mod of report.modified) {
      console.log(`  ~ ${mod.item.name}: ${mod.changes.join('; ')}`)
    }
  }

  if (report.unchanged.length > 0) {
    console.log(`\n[未变更] ${report.unchanged.length} 项`)
  }

  console.log('\n=====================================\n')
}

/**
 * 生成单个目录的 _meta.json 文件
 * @param dir - 目录路径
 * @param opts - 插件配置选项
 */
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
    } catch { }
  }

  let result: any[] = []

  /* ---------- 文件排序 ---------- */

  let sortedFiles = [...files].sort(opts.sort)

  if (opts.index && (opts.index as IndexOptions).first) {
    sortedFiles = sortedFiles.sort((a, b) =>
      a.startsWith('index') ? -1 : b.startsWith('index') ? 1 : 0
    )
  }

  /* ---------- 生成文件项 ---------- */

  for (const file of sortedFiles) {
    const name = file.replace(/\.(md|mdx)$/, '')
    let label = name

    const isIndexFile = name.toLowerCase() === 'index'
    const hasOptsIndex = opts.index !== undefined && opts.index !== false


    if (opts.useFrontmatter && !isIndexFile) {
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
        const { data } = matter(raw)
        if (data.title) label = data.title
      } catch { }
    }

    const oldItem = existingMap.get(name)

    // 处理 index 文件的 label 配置
    if (isIndexFile && hasOptsIndex) {
      const optsIndex = opts.index as IndexOptions
      const shouldRewrite = optsIndex.rewrite !== false

      if (shouldRewrite || !oldItem?.label) {
        if (optsIndex.name === false) {
          label = 'index'
        } else if (typeof optsIndex.name === 'string') {
          label = optsIndex.name
        } else {
          label = '首页'
        }
      }
    }

    result.push({
      type: 'file',
      name,
      label: isIndexFile ? label : (oldItem?.label ?? label)
    })
  }

  /* ---------- 生成目录项 ---------- */

  if (opts.generateDirMeta) {
    let sortedDirs = [...subDirs].sort(opts.sort)

    if (opts.index && (opts.index as IndexOptions).first) {
      sortedDirs = sortedDirs.sort((a, b) =>
        a.startsWith('index') ? -1 : b.startsWith('index') ? 1 : 0
      )
    }

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
    const oldItems: MetaItem[] = []
    if (fs.existsSync(metaPath)) {
      try {
        const parsed = JSON.parse(oldContent)
        oldItems.push(...parsed)
      } catch {
        console.warn(`[auto-meta-plugin] 警告: 无法解析现有 _meta.json 文件: ${metaPath}`)
      }
    }

    const validation = validateMetaStructure(result)
    if (!validation.valid) {
      console.error(`[auto-meta-plugin] 错误: 新 Meta 结构验证失败 - ${metaPath}`)
      for (const error of validation.errors) {
        console.error(`  - ${error}`)
      }
      return
    }

    const diffReport = generateDiffReport(result, oldItems, metaPath)

    if (opts.enableDiffLog) {
      logDiffReport(diffReport)
    }

    const updateLog = generateUpdateLog(diffReport)
    console.log(`[auto-meta-plugin] Meta 已更新: ${metaPath}`)
    console.log(`  新增: ${updateLog.summary.added}, 移除: ${updateLog.summary.removed}, 修改: ${updateLog.summary.modified}`)

    fs.writeFileSync(metaPath, newContent)
  }
}

/* ======================= 递归遍历 ======================= */

/**
 * 递归遍历目录并生成 _meta.json 文件
 * @param dir - 目录路径
 * @param opts - 插件配置选项
 */
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