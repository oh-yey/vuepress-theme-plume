---
title: “隐秘”文本
icon: lets-icons:hide-eye
createTime: 2024/08/18 23:02:39
permalink: /guide/components/plot/
---

## 概述

使用 `<Plot>` 组件显示 [“隐秘”文本](../markdown/plot.md) ，能够更灵活的控制行为。

该组件默认不启用，你需要在 theme 配置中启用。

```ts title=".vuepress/config.ts"
export default defineUserConfig({
  theme: plumeTheme({
    markdown: {
      plot: true,
    },
  })
})
```

## Props

| 名称    | 类型                                        | 默认值    | 说明                       |
| ------- | ------------------------------------------- | --------- | -------------------------- |
| trigger | `'hover' \| 'click'`                        | `'hover'` | 鼠标悬停触发，或者点击触发 |
| mask    | `string \| { light: string, dark: string }` | `#000`    | 遮罩颜色                   |
| color   | `string \| { light: string, dark: string }` | `#fff`    | 文本颜色                   |

## 示例

**输入：**

```md :no-line-numbers
- 鼠标悬停 - <Plot>悬停时可见</Plot>
- 点击 - <Plot trigger="click">点击时可见</Plot>
```

**输出：**

- 鼠标悬停 - <Plot>悬停时可见</Plot>
- 点击 - <Plot trigger="click">点击时可见</Plot>
