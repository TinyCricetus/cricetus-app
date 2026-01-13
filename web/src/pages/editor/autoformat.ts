import type { Value } from 'platejs'
import type { TPlateEditor } from 'platejs/react'
import { Editor, Element as SlateElement, Range, Transforms } from 'slate'
import {
  NODE_BLOCKQUOTE,
  NODE_CODE_BLOCK,
  NODE_H1,
  NODE_H2,
  NODE_H3,
  NODE_OL,
  NODE_PARAGRAPH,
  NODE_TODO_ITEM,
  NODE_TODO_LIST,
  NODE_UL
} from './constants'
import { toggleList } from './commands'

type AnyEditor = Editor | TPlateEditor<Value>

export const tryAutoformatOnSpace = (editor: AnyEditor) => {
  const slateEditor = editor as Editor
  if (!slateEditor.selection || !Range.isCollapsed(slateEditor.selection)) {
    return false
  }

  const blockEntry = Editor.above(slateEditor, {
    match: (node) => !Editor.isEditor(node) && SlateElement.isElement(node) && Editor.isBlock(slateEditor, node)
  })
  if (!blockEntry) {
    return false
  }

  const [block, blockPath] = blockEntry as any
  const blockType = (block as any)?.type
  if (blockType !== NODE_PARAGRAPH) {
    return false
  }

  const triggerRange = {
    anchor: Editor.start(slateEditor, blockPath),
    focus: slateEditor.selection.anchor
  }
  const triggerText = Editor.string(slateEditor, triggerRange)

  const setBlockType = (type: string, extra?: Record<string, any>) => {
    Transforms.setNodes(slateEditor, { type, ...(extra || {}) } as any, { at: blockPath })
  }

  const todoMatch = triggerText.match(/^[-*+] \[( |x|X)\]$/)
  if (todoMatch) {
    const checked = todoMatch[1].toLowerCase() === 'x'
    Transforms.delete(slateEditor, { at: triggerRange })
    setBlockType(NODE_TODO_ITEM, { checked })
    Transforms.wrapNodes(
      slateEditor,
      {
        type: NODE_TODO_LIST,
        children: []
      } as any,
      { at: blockPath }
    )
    return true
  }

  if (triggerText === '#') {
    Transforms.delete(slateEditor, { at: triggerRange })
    setBlockType(NODE_H1)
    return true
  }

  if (triggerText === '##') {
    Transforms.delete(slateEditor, { at: triggerRange })
    setBlockType(NODE_H2)
    return true
  }

  if (triggerText === '###') {
    Transforms.delete(slateEditor, { at: triggerRange })
    setBlockType(NODE_H3)
    return true
  }

  if (triggerText === '>') {
    Transforms.delete(slateEditor, { at: triggerRange })
    setBlockType(NODE_BLOCKQUOTE)
    return true
  }

  if (triggerText === '```') {
    Transforms.delete(slateEditor, { at: triggerRange })
    setBlockType(NODE_CODE_BLOCK)
    return true
  }

  if (triggerText === '-' || triggerText === '*' || triggerText === '+') {
    Transforms.delete(slateEditor, { at: triggerRange })
    toggleList(slateEditor as any, NODE_UL)
    return true
  }

  if (/^\d+\.$/.test(triggerText)) {
    Transforms.delete(slateEditor, { at: triggerRange })
    toggleList(slateEditor as any, NODE_OL)
    return true
  }

  return false
}
