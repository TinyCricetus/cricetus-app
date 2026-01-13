import type { Value } from 'platejs'
import type { TPlateEditor } from 'platejs/react'
import { Editor, Element as SlateElement, Node, Path, Transforms } from 'slate'
import {
  NODE_CODE_BLOCK,
  NODE_LI,
  NODE_OL,
  NODE_PARAGRAPH,
  NODE_TODO_ITEM,
  NODE_TODO_LIST,
  NODE_UL
} from './constants'

type AnyEditor = Editor | TPlateEditor<Value>

export const isMarkActive = (editor: AnyEditor, mark: string) => {
  const marks = Editor.marks(editor as Editor)
  return marks ? (marks as Record<string, any>)[mark] === true : false
}

export const toggleMark = (editor: AnyEditor, mark: string) => {
  if (isMarkActive(editor, mark)) {
    Editor.removeMark(editor as Editor, mark)
  } else {
    Editor.addMark(editor as Editor, mark, true)
  }
}

export const isBlockActive = (editor: AnyEditor, type: string) => {
  const slateEditor = editor as Editor
  if (!slateEditor.selection) {
    return false
  }
  const [match] = Editor.nodes(slateEditor, {
    at: slateEditor.selection,
    match: (node) => !Editor.isEditor(node) && SlateElement.isElement(node) && (node as any).type === type
  })
  return Boolean(match)
}

export const toggleBlock = (editor: AnyEditor, type: string) => {
  const slateEditor = editor as Editor
  const isActive = isBlockActive(editor, type)
  const newType = isActive ? NODE_PARAGRAPH : type
  Transforms.setNodes(
    slateEditor,
    { type: newType } as any,
    {
      match: (node) =>
        !Editor.isEditor(node) && SlateElement.isElement(node) && Editor.isBlock(slateEditor, node)
    }
  )
}

export const toggleList = (editor: AnyEditor, listType: string) => {
  const slateEditor = editor as Editor
  const isList = isBlockActive(editor, NODE_UL) || isBlockActive(editor, NODE_OL)

  if (isList) {
    Transforms.unwrapNodes(slateEditor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        ((n as any).type === NODE_UL || (n as any).type === NODE_OL),
      split: true
    })
    Transforms.setNodes(slateEditor, { type: NODE_PARAGRAPH } as any)
  } else {
    Transforms.setNodes(slateEditor, { type: NODE_LI } as any)
    Transforms.wrapNodes(
      slateEditor,
      {
        type: listType,
        children: []
      } as any
    )
  }
}

export const toggleCodeBlock = (editor: AnyEditor) => {
  const slateEditor = editor as Editor
  const isActive = isBlockActive(editor, NODE_CODE_BLOCK)
  Transforms.setNodes(
    slateEditor,
    { type: isActive ? NODE_PARAGRAPH : NODE_CODE_BLOCK } as any,
    {
      match: (node) =>
        !Editor.isEditor(node) && SlateElement.isElement(node) && Editor.isBlock(slateEditor, node)
    }
  )
}

export const toggleTodoList = (editor: AnyEditor) => {
  const slateEditor = editor as Editor
  const isActive = isBlockActive(editor, NODE_TODO_LIST)

  if (isActive) {
    Transforms.unwrapNodes(slateEditor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === NODE_TODO_LIST,
      split: true
    })
    Transforms.setNodes(
      slateEditor,
      { type: NODE_PARAGRAPH } as any,
      {
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === NODE_TODO_ITEM
      }
    )
    Transforms.unsetNodes(slateEditor, ['checked'] as any, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === NODE_PARAGRAPH
    })
    return
  }

  Transforms.setNodes(
    slateEditor,
    { type: NODE_TODO_ITEM, checked: false } as any,
    {
      match: (node) =>
        !Editor.isEditor(node) && SlateElement.isElement(node) && Editor.isBlock(slateEditor, node)
    }
  )
  Transforms.wrapNodes(
    slateEditor,
    {
      type: NODE_TODO_LIST,
      children: []
    } as any
  )
}

export const handleTodoEnter = (editor: AnyEditor) => {
  const slateEditor = editor as Editor
  if (!slateEditor.selection) {
    return false
  }

  const todoEntry = Editor.above(slateEditor, {
    match: (node) => !Editor.isEditor(node) && SlateElement.isElement(node) && (node as any).type === NODE_TODO_ITEM
  }) as any

  if (!todoEntry) {
    return false
  }

  const [todoNode, todoPath] = todoEntry as any
  const text = Node.string(todoNode)

  if (!text) {
    Transforms.unwrapNodes(slateEditor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === NODE_TODO_LIST,
      split: true
    })

    const updatedTodoEntry = Editor.above(slateEditor, {
      match: (node) =>
        !Editor.isEditor(node) && SlateElement.isElement(node) && (node as any).type === NODE_TODO_ITEM
    }) as any

    if (updatedTodoEntry) {
      const [, updatedPath] = updatedTodoEntry
      Transforms.setNodes(slateEditor, { type: NODE_PARAGRAPH } as any, { at: updatedPath })
      Transforms.unsetNodes(slateEditor, ['checked'] as any, { at: updatedPath })
    }

    return true
  }

  const nextPath = Path.next(todoPath)
  Transforms.insertNodes(
    slateEditor,
    {
      type: NODE_TODO_ITEM,
      checked: false,
      children: [{ text: '' }]
    } as any,
    { at: nextPath }
  )
  Transforms.select(slateEditor, Editor.start(slateEditor, nextPath))
  return true
}
