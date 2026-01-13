import type { Value } from 'platejs'
import { NODE_PARAGRAPH, NODE_TODO_ITEM, SUPPORTED_BLOCKS } from './constants'

export const DEFAULT_VALUE: Value = [
  {
    type: 'h1',
    children: [{ text: '富文本编辑器' }]
  },
  {
    type: NODE_PARAGRAPH,
    children: [
      {
        text: '这是一个功能丰富的富文本编辑器，所见即所得，直接输入即可编辑。'
      }
    ]
  },
  {
    type: 'h2',
    children: [{ text: '快速上手' }]
  },
  {
    type: NODE_PARAGRAPH,
    children: [{ text: '选择一段文字，尝试加粗、斜体、下划线、删除线、行内代码、标题或引用。' }]
  },
  {
    type: NODE_PARAGRAPH,
    children: [{ text: '支持的功能：' }]
  },
  {
    type: 'ul',
    children: [
      {
        type: 'li',
        children: [{ text: '文本格式：加粗、斜体、下划线、删除线、行内代码' }]
      },
      {
        type: 'li',
        children: [{ text: '标题：H1、H2、H3' }]
      },
      {
        type: 'li',
        children: [{ text: '列表：有序列表、无序列表' }]
      },
      {
        type: 'li',
        children: [{ text: '其他：引用、代码块、链接、代办事项' }]
      }
    ]
  },
  {
    type: NODE_PARAGRAPH,
    children: [{ text: '小技巧：输入 \"- [ ]\" 然后按空格，可以快速创建代办事项。' }]
  }
]

export const normalizeValue = (input: Value): Value => {
  const normalizeNode = (node: any): any => {
    if (!node || typeof node !== 'object') {
      return node
    }

    if (!Array.isArray(node.children)) {
      return node
    }

    const normalizedChildren = node.children.map(normalizeNode)

    if (node.type && !SUPPORTED_BLOCKS.has(node.type)) {
      return { type: NODE_PARAGRAPH, children: normalizedChildren }
    }

    if (node.type === NODE_TODO_ITEM) {
      return {
        ...node,
        checked: typeof node.checked === 'boolean' ? node.checked : false,
        children: normalizedChildren
      }
    }

    return { ...node, children: normalizedChildren }
  }

  return input.map(normalizeNode)
}

export const parseStoredValue = (stored: string | null) => {
  if (!stored) {
    return DEFAULT_VALUE
  }
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return normalizeValue(parsed as Value)
    }
  } catch {
    return DEFAULT_VALUE
  }
  return DEFAULT_VALUE
}
