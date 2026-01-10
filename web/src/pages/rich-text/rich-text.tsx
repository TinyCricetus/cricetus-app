import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Editor, Element as SlateElement, Node, Transforms } from 'slate'
import storage from '../../services/storage'
import './rich-text.css'
import type { Value } from 'platejs'
import { Plate, PlateContent, PlateElement, usePlateEditor, type PlateElementProps, type TPlateEditor } from 'platejs/react'
import {
  BlockquotePlugin,
  BoldPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin
} from '@platejs/basic-nodes/react'

const STORAGE_DEBOUNCE_MS = 1200
const NODE_PARAGRAPH = 'p'
const NODE_BLOCKQUOTE = 'blockquote'
const NODE_H1 = 'h1'
const NODE_H2 = 'h2'
const NODE_H3 = 'h3'
const SUPPORTED_BLOCKS = new Set([NODE_PARAGRAPH, NODE_BLOCKQUOTE, NODE_H1, NODE_H2, NODE_H3])

type ToolbarButtonProps = {
  isActive: boolean
  onToggle: () => void
  label: string
  children: ReactNode
}

const ToolbarButton = ({ isActive, onToggle, label, children }: ToolbarButtonProps) => (
  <button
    type="button"
    className="md-toolbar-btn"
    aria-pressed={isActive}
    aria-label={label}
    title={label}
    onMouseDown={(event) => {
      event.preventDefault()
      onToggle()
    }}
  >
    {children}
  </button>
)

const isMarkActive = (editor: Editor | TPlateEditor<Value>, mark: string) => {
  const marks = Editor.marks(editor as Editor)
  return marks ? (marks as Record<string, any>)[mark] === true : false
}

const toggleMark = (editor: Editor | TPlateEditor<Value>, mark: string) => {
  if (isMarkActive(editor, mark)) {
    Editor.removeMark(editor as Editor, mark)
  } else {
    Editor.addMark(editor as Editor, mark, true)
  }
}

const isBlockActive = (editor: Editor | TPlateEditor<Value>, type: string) => {
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

const toggleBlock = (editor: Editor | TPlateEditor<Value>, type: string) => {
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

const H1Element = (props: PlateElementProps) => <PlateElement as="h1" {...props} />
const H2Element = (props: PlateElementProps) => <PlateElement as="h2" {...props} />
const H3Element = (props: PlateElementProps) => <PlateElement as="h3" {...props} />
const BlockquoteElement = (props: PlateElementProps) => <PlateElement as="blockquote" {...props} />

const RichTextToolbar = ({ editor }: { editor: TPlateEditor<Value> | Editor }) => {
  return (
    <div className="md-toolbar" role="toolbar" aria-label="编辑工具">
      <div className="md-toolbar-group">
        <span className="md-toolbar-label">文本</span>
        <ToolbarButton
          isActive={isMarkActive(editor, 'bold')}
          onToggle={() => toggleMark(editor, 'bold')}
          label="加粗 (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          isActive={isMarkActive(editor, 'italic')}
          onToggle={() => toggleMark(editor, 'italic')}
          label="斜体 (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          isActive={isMarkActive(editor, 'underline')}
          onToggle={() => toggleMark(editor, 'underline')}
          label="下划线 (Ctrl+U)"
        >
          <span>U</span>
        </ToolbarButton>
      </div>
      <div className="md-toolbar-group">
        <span className="md-toolbar-label">标题</span>
        <ToolbarButton
          isActive={isBlockActive(editor, NODE_H1)}
          onToggle={() => toggleBlock(editor, NODE_H1)}
          label="标题 1"
        >
          <span>H1</span>
        </ToolbarButton>
        <ToolbarButton
          isActive={isBlockActive(editor, NODE_H2)}
          onToggle={() => toggleBlock(editor, NODE_H2)}
          label="标题 2"
        >
          <span>H2</span>
        </ToolbarButton>
        <ToolbarButton
          isActive={isBlockActive(editor, NODE_H3)}
          onToggle={() => toggleBlock(editor, NODE_H3)}
          label="标题 3"
        >
          <span>H3</span>
        </ToolbarButton>
      </div>
      <div className="md-toolbar-group">
        <span className="md-toolbar-label">结构</span>
        <ToolbarButton
          isActive={isBlockActive(editor, NODE_BLOCKQUOTE)}
          onToggle={() => toggleBlock(editor, NODE_BLOCKQUOTE)}
          label="引用"
        >
          <span>&gt;</span>
        </ToolbarButton>
      </div>
    </div>
  )
}

export default function RichText() {
  const defaultValue: Value = useMemo(
    () => [
      {
        type: NODE_H1,
        children: [{ text: '富文本编辑器' }]
      },
      {
        type: NODE_PARAGRAPH,
        children: [
          {
            text: '这是一个单区富文本编辑器，所见即所得，直接输入即可编辑。'
          }
        ]
      },
      {
        type: NODE_H2,
        children: [{ text: '快速上手' }]
      },
      {
        type: NODE_PARAGRAPH,
        children: [{ text: '选择一段文字，尝试加粗、斜体、标题或引用。' }]
      },
      {
        type: NODE_PARAGRAPH,
        children: [{ text: '支持：加粗、斜体、下划线、标题、引用。' }]
      }
    ],
    []
  )

  const normalizeValue = (input: Value): Value => {
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
      return { ...node, children: normalizedChildren }
    }
    return input.map(normalizeNode)
  }

  const parseStoredValue = (stored: string | null) => {
    if (!stored) {
      return defaultValue
    }
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return normalizeValue(parsed as Value)
      }
    } catch {
      return defaultValue
    }
    return defaultValue
  }

  const initialValue = useMemo(() => parseStoredValue(storage.getMarkdownContent()), [])
  const [value, setValue] = useState<Value>(initialValue)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const plugins = useMemo(
    () => [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement)
    ],
    []
  )
  const editor = usePlateEditor({
    plugins,
    value: initialValue
  })

  useEffect(() => {
    setSaveState('saving')
    const timer = window.setTimeout(() => {
      storage.setMarkdownContent(JSON.stringify(value))
      setSaveState('saved')
      setLastSavedAt(new Date())
    }, STORAGE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [value])

  const stats = useMemo(() => {
    const text = value.map((node) => Node.string(node)).join('\n')
    const trimmed = text.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    const chars = text.replace(/\s/g, '').length
    return { words, chars }
  }, [value])

  const saveLabel = useMemo(() => {
    if (saveState === 'saving') {
      return '保存中...'
    }
    if (saveState === 'saved' && lastSavedAt) {
      const time = new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(lastSavedAt)
      return `已保存 ${time}`
    }
    return '未保存'
  }, [saveState, lastSavedAt])

  return (
    <div className="md-container">
      <Plate
        editor={editor}
        onChange={({ value }) => {
          setValue(value)
        }}
      >
        <div className="md-editor-card">
          <div className="md-toolbar-row">
            <RichTextToolbar editor={editor as any} />
            <div className="md-meta">
              <div className={`md-save md-save--${saveState}`}>{saveLabel}</div>
              <div className="md-stats">
                <span>字数 {stats.chars}</span>
                <span>词数 {stats.words}</span>
              </div>
            </div>
          </div>
          <div className="md-editor-shell">
            <PlateContent className="md-editor" placeholder="开始写作..." autoFocus />
          </div>
        </div>
      </Plate>
    </div>
  )
}
