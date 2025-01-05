import type { App } from 'vuepress'
import type { Markdown } from 'vuepress/markdown'
import type { DemoContainerRender, DemoFile, DemoMeta, MarkdownDemoEnv } from '../../shared/demo.js'
import fs from 'node:fs'
import path from 'node:path'
import { findFile } from './findFile.js'
import { insertSetupScript } from './insertScript.js'

export function vueEmbed(
  app: App,
  md: Markdown,
  env: MarkdownDemoEnv,
  { url, title, desc, codeSetting = '' }: DemoMeta,
) {
  const filepath = findFile(app, env, url)
  try {
    const code = fs.readFileSync(filepath, 'utf-8')
    const basename = path.basename(filepath).replace(/\.vue$/, '')
    const name = `Demo${basename[0].toUpperCase()}${basename.slice(1)}`
    const demo: DemoFile = { type: 'vue', export: name, path: filepath }

    env.demoFiles ??= []

    if (!env.demoFiles.some(d => d.path === filepath)) {
      env.demoFiles.push(demo)
      insertSetupScript(demo, env)
    }

    return `<VPDemoVue${title ? ` title="${title}"` : ''}${desc ? ` desc="${desc}"` : ''}>
    <${name} />
    <template #code>
      ${md.render(`\`\`\`vue${codeSetting}\n${code}\n\`\`\``, {})}
    </template>
  </VPDemoVue>`
  }
  catch {
    console.warn('[vuepress-plugin-md-power] Cannot read vue file:', filepath)
    return ''
  }
}

const target = 'md-power/demo/vue'

export const vueContainerRender: DemoContainerRender = {
  before: (app, md, env, meta, codeMap) => {
    const { url, title, desc } = meta
    const componentName = `DemoContainer${url}`
    const prefix = (env.filePathRelative || '').replace(/\.md$/, '').replace(/\//g, '-')
    env.demoFiles ??= []
    const output = app.dir.temp(path.join(target, `${prefix}-${componentName}`))
    // generate script file
    if (codeMap.vue || codeMap.js || codeMap.ts) {
      let scriptOutput = output
      let content = ''
      if (codeMap.vue) {
        scriptOutput += '.vue'
        content = transformStyle(codeMap.vue)
      }
      else if (codeMap.ts) {
        scriptOutput += '.ts'
        content = codeMap.ts
      }
      else if (codeMap.js) {
        scriptOutput += '.js'
        content = codeMap.js
      }

      content = transformImports(content, env.filePath || '', app.dir.source())
      const script: DemoFile = { type: 'vue', export: componentName, path: scriptOutput, gitignore: true }
      fs.mkdirSync(path.dirname(scriptOutput), { recursive: true })
      fs.writeFileSync(scriptOutput, content, 'utf-8')

      if (!env.demoFiles.some(d => d.path === scriptOutput)) {
        env.demoFiles.push(script)
        insertSetupScript(script, env)
      }
    }
    // generate style file
    if (codeMap.css || codeMap.scss || codeMap.less || codeMap.styl) {
      let styleOutput = output
      let content = ''
      if (codeMap.css) {
        styleOutput += '.css'
        content = codeMap.css
      }
      else if (codeMap.scss) {
        styleOutput += '.scss'
        content = codeMap.scss
      }
      else if (codeMap.less) {
        styleOutput += '.less'
        content = codeMap.less
      }
      else if (codeMap.styl) {
        styleOutput += '.styl'
        content = codeMap.styl
      }
      fs.mkdirSync(path.dirname(styleOutput), { recursive: true })
      fs.writeFileSync(styleOutput, content, 'utf-8')
      const style: DemoFile = { type: 'css', path: styleOutput, gitignore: true }
      if (!env.demoFiles.some(d => d.path === styleOutput)) {
        env.demoFiles.push(style)
        insertSetupScript(style, env)
      }
    }

    return `<VPDemoVue${title ? ` title="${title}"` : ''}${desc ? ` desc="${desc}"` : ''}>
    <${componentName} />
    <template #code>\n`
  },
  after: () => '</template></VPDemoVue>',
}

const IMPORT_RE = /import\s+(?:\w+\s+from\s+)?['"]([^'"]+)['"]/g
const STYLE_RE = /<style.*?>/

function transformImports(code: string, filepath: string, appSource: string): string {
  return code.replace(IMPORT_RE, (matched, url) => {
    if (url.startsWith('./') || url.startsWith('../')) {
      return matched.replace(url, `${path.resolve(path.dirname(filepath), url)}`)
    }
    if (url.startsWith('@source/')) {
      return matched.replace(url, `${appSource}${url.slice('@source/'.length)}`)
    }
    return matched
  })
}

function transformStyle(code: string): string {
  return code.replace(STYLE_RE, (matched) => {
    if (matched.includes('scoped')) {
      return matched
    }
    return matched.replace('<style', '<style scoped')
  })
}
