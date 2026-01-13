import { useState, type ReactNode } from 'react'
import type { Value } from 'platejs'
import type { TPlateEditor } from 'platejs/react'
import { Editor, Element as SlateElement, Transforms } from 'slate'
import {
  NODE_BLOCKQUOTE,
  NODE_CODE_BLOCK,
  NODE_H1,
  NODE_H2,
  NODE_H3,
  NODE_LINK,
  NODE_OL,
  NODE_TODO_LIST,
  NODE_UL
} from './constants'
import {
  isBlockActive,
  isMarkActive,
  toggleBlock,
  toggleCodeBlock,
  toggleList,
  toggleMark,
  toggleTodoList
} from './commands'

type AnyEditor = TPlateEditor<Value> | Editor

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

export const EditorToolbar = ({ editor }: { editor: AnyEditor }) => {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  const insertLink = () => {
    const slateEditor = editor as Editor
    if (!slateEditor.selection) {
      setShowLinkInput(false)
      return
    }

    if (!linkUrl.trim()) {
      const [match] = Editor.nodes(slateEditor, {
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === NODE_LINK
      })
      if (match) {
        Transforms.unwrapNodes(slateEditor, {
          match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === NODE_LINK
        })
      }
      setShowLinkInput(false)
      return
    }

    const [match] = Editor.nodes(slateEditor, {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === NODE_LINK
    })

    if (match) {
      Transforms.setNodes(
        slateEditor,
        { url: linkUrl } as any,
        {
          match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === NODE_LINK
        }
      )
    } else {
      const range = Editor.range(slateEditor, slateEditor.selection)
      const isCollapsed =
        range.anchor.path.join(',') === range.focus.path.join(',') && range.anchor.offset === range.focus.offset
      if (isCollapsed) {
        Transforms.insertNodes(slateEditor, {
          type: NODE_LINK,
          url: linkUrl,
          children: [{ text: linkUrl }]
        } as any)
      } else {
        const link = {
          type: NODE_LINK,
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
          isActive={isMarkActive(editor as any, 'bold')}
          onToggle={() => toggleMark(editor as any, 'bold')}
          label="加粗 (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          isActive={isMarkActive(editor as any, 'italic')}
          onToggle={() => toggleMark(editor as any, 'italic')}
          label="斜体 (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          isActive={isMarkActive(editor as any, 'underline')}
          onToggle={() => toggleMark(editor as any, 'underline')}
          label="下划线 (Ctrl+U)"
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          isActive={isMarkActive(editor as any, 'strikethrough')}
          onToggle={() => toggleMark(editor as any, 'strikethrough')}
          label="删除线"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </ToolbarButton>
        <ToolbarButton
          isActive={isMarkActive(editor as any, 'code')}
          onToggle={() => toggleMark(editor as any, 'code')}
          label="行内代码"
        >
          <code style={{ fontSize: '12px' }}>&lt;/&gt;</code>
        </ToolbarButton>
      </div>

      <div className="md-toolbar-group">
        <span className="md-toolbar-label">标题</span>
        <ToolbarButton isActive={isBlockActive(editor as any, NODE_H1)} onToggle={() => toggleBlock(editor as any, NODE_H1)} label="标题 1">
          <span>H1</span>
        </ToolbarButton>
        <ToolbarButton isActive={isBlockActive(editor as any, NODE_H2)} onToggle={() => toggleBlock(editor as any, NODE_H2)} label="标题 2">
          <span>H2</span>
        </ToolbarButton>
        <ToolbarButton isActive={isBlockActive(editor as any, NODE_H3)} onToggle={() => toggleBlock(editor as any, NODE_H3)} label="标题 3">
          <span>H3</span>
        </ToolbarButton>
      </div>

      <div className="md-toolbar-group">
        <span className="md-toolbar-label">列表</span>
        <ToolbarButton isActive={isBlockActive(editor as any, NODE_UL)} onToggle={() => toggleList(editor as any, NODE_UL)} label="无序列表">
          <span>•</span>
        </ToolbarButton>
        <ToolbarButton isActive={isBlockActive(editor as any, NODE_OL)} onToggle={() => toggleList(editor as any, NODE_OL)} label="有序列表">
          <span>1.</span>
        </ToolbarButton>
        <ToolbarButton isActive={isBlockActive(editor as any, NODE_TODO_LIST)} onToggle={() => toggleTodoList(editor as any)} label="代办事项">
          <span>☐</span>
        </ToolbarButton>
      </div>

      <div className="md-toolbar-group">
        <span className="md-toolbar-label">结构</span>
        <ToolbarButton
          isActive={isBlockActive(editor as any, NODE_BLOCKQUOTE)}
          onToggle={() => toggleBlock(editor as any, NODE_BLOCKQUOTE)}
          label="引用"
        >
          <span>&gt;</span>
        </ToolbarButton>
        <ToolbarButton
          isActive={isBlockActive(editor as any, NODE_CODE_BLOCK)}
          onToggle={() => toggleCodeBlock(editor as any)}
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
