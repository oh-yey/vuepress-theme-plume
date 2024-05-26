import type { BlogDataPluginOptions } from '@vuepress-plume/plugin-blog-data'
import { removeLeadingSlash } from '@vuepress/helper'
import {
  isEncryptPage,
  resolveNotesOptions,
} from '../config/index.js'
import { normalizePath } from '../utils.js'
import type { PlumeThemeEncrypt, PlumeThemeLocaleOptions } from '../..//shared/index.js'
import {
  BLOG_TAGS_COLORS_PRESET,
  generateBlogTagsColors,
} from './blogTags.js'

export function resolveBlogDataOptions(
  localeOptions: PlumeThemeLocaleOptions,
  encrypt?: PlumeThemeEncrypt,
): BlogDataPluginOptions {
  const blog = localeOptions.blog || {}
  const notesList = resolveNotesOptions(localeOptions)
  const notesDirList = notesList
    .map(notes => removeLeadingSlash(normalizePath(`${notes.dir}/**`)))
    .filter(Boolean)

  return {
    include: blog?.include ?? ['**/*.md'],
    exclude: [
      '**/{README,readme,index}.md',
      '.vuepress/',
      'node_modules/',
      ...(blog?.exclude ?? []),
      ...notesDirList,
    ].filter(Boolean),
    sortBy: 'createTime',
    excerpt: true,
    pageFilter: (page: any) => page.frontmatter.article !== undefined
      ? !!page.frontmatter.article
      : true,
    extraBlogData(extra) {
      extra.tagsColorsPreset = BLOG_TAGS_COLORS_PRESET
      extra.tagsColors = {}
    },
    extendBlogData: (page: any, extra) => {
      const tags = page.frontmatter.tags
      generateBlogTagsColors(extra.tagsColors, tags)
      const data: Record<string, any> = {
        categoryList: page.data.categoryList,
        tags,
        sticky: page.frontmatter.sticky,
        createTime: page.data.frontmatter.createTime,
        lang: page.lang,
      }
      isEncryptPage(page, encrypt) && (data.encrypt = true)
      return data
    },
  }
}
