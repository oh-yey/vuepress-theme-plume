import type {
  AutoFrontmatterArray,
  AutoFrontmatterOptions,
  ThemeNote,
  ThemeNoteListOptions,
  ThemeOptions,
} from '../../shared/index.js'
import { uniq } from '@pengzhanbo/utils'
import { ensureLeadingSlash } from '@vuepress/helper'
import { resolveLocalePath } from 'vuepress/shared'
import { path } from 'vuepress/utils'
import { resolveNotesDirs } from '../config/index.js'
import { getCurrentDirname, nanoid, normalizePath, pathJoin, withBase } from '../utils/index.js'
import { createBaseFrontmatter } from './baseFrontmatter.js'
import { resolveLinkBySidebar } from './resolveLinkBySidebar.js'

export function resolveOptions(
  options: ThemeOptions,
  autoFrontmatter: AutoFrontmatterOptions,
): AutoFrontmatterOptions {
  const resolveLocale = (relativeFilepath: string): string =>
    resolveLocalePath(options.locales!, ensureLeadingSlash(relativeFilepath))

  const findNotesByLocale = (locale: string): ThemeNoteListOptions | undefined => {
    const notes = options.locales?.[locale]?.notes
    return notes === false ? undefined : notes
  }

  const findNote = (relativeFilepath: string): ThemeNote | undefined => {
    const locale = resolveLocale(relativeFilepath)
    const filepath = ensureLeadingSlash(relativeFilepath)
    const notes = findNotesByLocale(locale)
    if (!notes)
      return undefined
    const notesList = notes?.notes || []
    const notesDir = notes?.dir || ''
    return notesList.find(note =>
      filepath.startsWith(normalizePath(`${notesDir}/${note.dir}`)),
    )
  }

  const baseFrontmatter = createBaseFrontmatter(autoFrontmatter)
  const localesNotesDirs = resolveNotesDirs(options)
  const configs: AutoFrontmatterArray = []

  if (localesNotesDirs.length) {
    // note 首页
    configs.push({
      include: localesNotesDirs.map(dir => pathJoin(dir, '/{readme,README,index}.md')),
      frontmatter: {
        title(title: string, { relativePath }) {
          if (title)
            return title
          if (autoFrontmatter.title === false)
            return
          return findNote(relativePath)?.text || getCurrentDirname('', relativePath)
        },
        ...baseFrontmatter,
        permalink(permalink: string, { relativePath }, data: any) {
          if (permalink)
            return permalink
          if (autoFrontmatter.permalink === false || data.friends || data.pageLayout === 'friends')
            return

          const locale = resolveLocale(relativePath)
          const prefix = findNotesByLocale(locale)?.link || ''
          const note = findNote(relativePath)
          return pathJoin(
            prefix.startsWith(locale) ? '/' : locale,
            prefix,
            note?.link || getCurrentDirname(note?.dir, relativePath),
            '/',
          )
        },
      },
    })
    // note page
    configs.push({
      include: localesNotesDirs.map(dir => `${dir}**/**.md`),
      frontmatter: {
        title(title: string, { relativePath }) {
          if (title)
            return title
          if (autoFrontmatter.title === false)
            return
          return path.basename(relativePath, '.md').replace(/^\d+\./, '')
        },
        ...baseFrontmatter,
        permalink(permalink: string, { relativePath }, data) {
          if (permalink)
            return permalink
          if (autoFrontmatter.permalink === false)
            return
          if (data.friends || data.pageLayout === 'friends')
            return
          const locale = resolveLocale(relativePath)
          const notes = findNotesByLocale(locale)
          const note = findNote(relativePath)
          const prefix = notes?.link || ''
          const args: string[] = [
            prefix.startsWith(locale) ? '/' : locale,
            prefix,
            note?.link || '',
          ]
          const sidebar = note?.sidebar

          if (note && sidebar && sidebar !== 'auto') {
            const res = resolveLinkBySidebar(sidebar, pathJoin(notes?.dir || '', note.dir || ''))
            const file = ensureLeadingSlash(relativePath)
            if (res[file]) {
              args.push(res[file])
            }
            else if (res[path.dirname(file)]) {
              args.push(res[path.dirname(file)])
            }
          }

          return pathJoin(...args, nanoid(), '/')
        },
      },
    })
  }
  // 未知 readme 不处理
  configs.push({
    include: '**/{readme,README,index}.md',
    frontmatter: {},
  })

  if (options.blog !== false) {
    // 博客文章
    configs.push({
      include: options.blog?.include ?? ['**/*.md'],
      frontmatter: {
        title(title: string, { relativePath }) {
          if (title)
            return title
          if (autoFrontmatter.title === false)
            return
          return path.basename(relativePath || '', '.md')
        },
        ...baseFrontmatter,
        permalink(permalink: string, { relativePath }) {
          if (permalink)
            return permalink
          if (autoFrontmatter.permalink === false)
            return
          const locale = resolveLocale(relativePath)
          const prefix = withBase(options.article || '/article/', locale)

          return normalizePath(`${prefix}/${nanoid()}/`)
        },
      },
    })
  }

  // 其他
  configs.push({
    include: '*',
    frontmatter: {
      title(title: string, { relativePath }) {
        if (title)
          return title
        if (autoFrontmatter.title === false)
          return
        return path.basename(relativePath || '', '.md')
      },
      ...baseFrontmatter,
      permalink(permalink: string, { relativePath }) {
        if (permalink)
          return permalink
        if (autoFrontmatter.permalink === false)
          return
        return ensureLeadingSlash(normalizePath(relativePath.replace(/\.md$/, '/')))
      },
    },
  })

  return {
    include: autoFrontmatter?.include ?? ['**/*.md'],
    exclude: uniq(['.vuepress/**/*', 'node_modules', ...(autoFrontmatter?.exclude ?? [])]),
    frontmatter: configs,
  }
}
