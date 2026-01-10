import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Editor, Element as SlateElement, Node, Transforms } from 'slate'
import storage from '../../services/storage'
import './rich-text.css'
import type { Value } from 'platejs'
import { Plate, PlateContent, PlateElement, usePlateEditor, createPlatePlugin, type PlateElementProps, type TPlateEditor } from 'platejs/react'
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin
} from '@platejs/basic-nodes/react'

const STORAGE_DEBOUNCE_MS = 1200
const NODE_PARAGRAPH = 'p'
const NODE_BLOCKQUOTE = 'blockquote'
const NODE_H1 = 'h1'
const NODE_H2 = 'h2'
const NODE_H3 = 'h3'
const NODE_CODE_BLOCK = 'code_block'
const NODE_UL = 'ul'
const NODE_OL = 'ol'
const NODE_LI = 'li'
const SUPPORTED_BLOCKS = new Set([
  NODE_PARAGRAPH,
  NODE_BLOCKQUOTE,
  NODE_H1,
  NODE_H2,
  NODE_H3,
  NODE_CODE_BLOCK,
  NODE_UL,
  NODE_OL,
  NODE_LI
])

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
const CodeBlockElement = (props: PlateElementProps) => (
  <PlateElement as="pre" {...props}>
    <PlateElement as="code" {...props} />
  </PlateElement>
)

const LinkElement = ({ attributes, children, element, ...props }: PlateElementProps) => {
  const url = (element as any)?.url || '#'
  return (
    <a href={url} {...attributes} {...(props as any)}>
      {children}
    </a>
  )
}

const ListElement = (props: PlateElementProps) => {
  const element = props.element as any
  const Tag = element?.type === 'ol' ? 'ol' : 'ul'
  return <Tag {...(props.attributes || {})} {...(props as any)}>{props.children}</Tag>
}

const ListItemElement = (props: PlateElementProps) => (
  <li {...(props.attributes || {})} {...(props as any)}>
    {props.children}
  </li>
)

// 创建自定义插件
const CodeInlinePlugin = createPlatePlugin({
  key: 'code',
  node: {
    isElement: false,
    isLeaf: true
  }
})

const LinkPlugin = createPlatePlugin({
  key: 'a',
  node: {
    isElement: true,
    isVoid: false
  }
})

const UlListPlugin = createPlatePlugin({
  key: 'ul',
  node: {
    isElement: true
  }
})

const OlListPlugin = createPlatePlugin({
  key: 'ol',
  node: {
    isElement: true
  }
})

const ListItemPlugin = createPlatePlugin({
  key: 'li',
  node: {
    isElement: true
  }
})

const toggleList = (editor: Editor | TPlateEditor<Value>, listType: string) => {
  const slateEditor = editor as Editor
  const isActive = isBlockActive(editor, listType)
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
    const newBlock = {
      type: listType,
      children: []
    }
    Transforms.wrapNodes(slateEditor, newBlock as any)
  }
}

const toggleCodeBlock = (editor: Editor | TPlateEditor<Value>) => {
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

const RichTextToolbar = ({ editor }: { editor: TPlateEditor<Value> | Editor }) => {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  const insertLink = () => {
    const slateEditor = editor as Editor
    if (!slateEditor.selection) {
      setShowLinkInput(false)
      return
    }

    if (!linkUrl.trim()) {
      // 如果没有 URL，尝试移除现有链接
      const [match] = Editor.nodes(slateEditor, {
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'a'
      })
      if (match) {
        Transforms.unwrapNodes(slateEditor, {
          match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'a'
        })
      }
      setShowLinkInput(false)
      return
    }

    // 检查是否已有链接
    const [match] = Editor.nodes(slateEditor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'a'
    })

    if (match) {
      // 更新现有链接
      Transforms.setNodes(
        slateEditor,
        { url: linkUrl } as any,
        {
          match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'a'
        }
      )
    } else {
      // 插入新链接
      const range = Editor.range(slateEditor, slateEditor.selection)
      const isCollapsed = range.anchor.path.join(',') === range.focus.path.join(',') && range.anchor.offset === range.focus.offset
      if (isCollapsed) {
        // 如果选择已折叠，插入文本和链接
        Transforms.insertNodes(slateEditor, {
          type: 'a',
          url: linkUrl,
          children: [{ text: linkUrl }]
        } as any)
      } else {
        // 如果有选中文本，包装为链接
        const link = {
          type: 'a',
          url: linkUrl,
          children: []
        }
        Transforms.wrapNodes(slateEditor, link as any, { split: true })
      }
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }

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
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          isActive={isMarkActive(editor, 'strikethrough')}
          onToggle={() => toggleMark(editor, 'strikethrough')}
          label="删除线"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </ToolbarButton>
        <ToolbarButton
          isActive={isMarkActive(editor, 'code')}
          onToggle={() => toggleMark(editor, 'code')}
          label="行内代码"
        >
          <code style={{ fontSize: '12px' }}>&lt;/&gt;</code>
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
        <span className="md-toolbar-label">列表</span>
        <ToolbarButton
          isActive={isBlockActive(editor, NODE_UL)}
          onToggle={() => toggleList(editor, NODE_UL)}
          label="无序列表"
        >
          <span>•</span>
        </ToolbarButton>
        <ToolbarButton
          isActive={isBlockActive(editor, NODE_OL)}
          onToggle={() => toggleList(editor, NODE_OL)}
          label="有序列表"
        >
          <span>1.</span>
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
        <ToolbarButton
          isActive={isBlockActive(editor, NODE_CODE_BLOCK)}
          onToggle={() => toggleCodeBlock(editor)}
          label="代码块"
        >
          <code style={{ fontSize: '12px' }}>{'{}'}</code>
        </ToolbarButton>
        <ToolbarButton
          isActive={showLinkInput}
          onToggle={() => {
            setShowLinkInput(!showLinkInput)
            if (!showLinkInput) {
              setTimeout(() => {
                const input = document.querySelector('.md-link-input') as HTMLInputElement
                input?.focus()
              }, 0)
            }
          }}
          label="链接"
        >
          <span>🔗</span>
        </ToolbarButton>
      </div>
      {showLinkInput && (
        <div className="md-link-input-wrapper">
          <input
            type="text"
            className="md-link-input"
            placeholder="输入链接地址..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                insertLink()
              } else if (e.key === 'Escape') {
                setShowLinkInput(false)
                setLinkUrl('')
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!document.activeElement?.closest('.md-link-input-wrapper')) {
                  insertLink()
                }
              }, 200)
            }}
          />
        </div>
      )}
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
            text: '这是一个功能丰富的富文本编辑器，所见即所得，直接输入即可编辑。'
          }
        ]
      },
      {
        type: NODE_H2,
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
        type: NODE_UL,
        children: [
          {
            type: NODE_LI,
            children: [{ text: '文本格式：加粗、斜体、下划线、删除线、行内代码' }]
          },
          {
            type: NODE_LI,
            children: [{ text: '标题：H1、H2、H3' }]
          },
          {
            type: NODE_LI,
            children: [{ text: '列表：有序列表、无序列表' }]
          },
          {
            type: NODE_LI,
            children: [{ text: '其他：引用、代码块、链接' }]
          }
        ]
      },
      {
        type: NODE_PARAGRAPH,
        children: [{ text: '试试插入一个链接，或者创建一个代码块！' }]
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
      StrikethroughPlugin,
      CodeInlinePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      CodePlugin.withComponent(CodeBlockElement),
      UlListPlugin.withComponent(ListElement),
      OlListPlugin.withComponent(ListElement),
      ListItemPlugin.withComponent(ListItemElement),
      LinkPlugin.withComponent(LinkElement)
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
