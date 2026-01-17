import { useMemo, KeyboardEvent, useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import './editor.css'
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  withReact,
  useSlateStatic,
  ReactEditor,
} from 'slate-react'
import { Descendant, Editor, Element, Transforms, createEditor, Text, Range, Point, Node, Path } from 'slate'
import { withHistory } from 'slate-history'
import { ListElement, HeadingElement, FormattedText, TaskListElement } from './slate-types'
import { Table, TableRow, TableCell, TableToolbar, withTable } from './table'
import { EditorToolbar } from './toolbar'
import { EditorStatusBar } from './status-bar'
import { SlashMenu } from './slash-menu'
import storage from '../../services/storage'
import { STORAGE_DEBOUNCE_MS } from './constants'

const defaultValue: any[] = [
  {
    type: 'heading',
    level: 1,
    children: [{ text: '欢迎使用 Cricetus 编辑器' }],
  },
  {
    type: 'paragraph',
    children: [{ text: '这是一个功能丰富的富文本编辑器，支持多种 Markdown 语法和快捷操作。' }],
  },
  {
    type: 'heading',
    level: 2,
    children: [{ text: '快捷命令' }],
  },
  {
    type: 'paragraph',
    children: [{ text: '输入 / 可以打开命令菜单，快速插入各种块级元素：' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '标题（一级到六级）' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '有序列表、无序列表、任务列表' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '引用、代码块、表格' }],
  },
  {
    type: 'heading',
    level: 2,
    children: [{ text: 'Markdown 语法' }],
  },
  {
    type: 'paragraph',
    children: [{ text: '也可以直接使用 Markdown 语法：' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '输入 # 加空格创建一级标题（## 二级，### 三级...）' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '输入 > 加空格创建引用块' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '输入 ``` 加空格创建代码块' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '输入 - [ ] 加空格创建任务列表' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '输入 1. 加空格创建有序列表' }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: '输入 - 加空格创建无序列表' }],
  },
  {
    type: 'heading',
    level: 2,
    children: [{ text: '文本格式' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: '选中文本后使用工具栏或快捷键：' },
    ],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: 'Ctrl+B 加粗', bold: true }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: 'Ctrl+I 斜体', italic: true }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: 'Ctrl+U 下划线', underline: true }],
  },
  {
    type: 'bullet-list',
    indent: 0,
    uuid: generateUuid(),
    children: [{ text: 'Ctrl+` 行内代码', code: true }],
  },
  {
    type: 'heading',
    level: 2,
    children: [{ text: '示例：任务列表' }],
  },
  {
    type: 'task-list',
    indent: 0,
    uuid: generateUuid(),
    checked: true,
    children: [{ text: '完成编辑器基础功能' }],
  },
  {
    type: 'task-list',
    indent: 0,
    uuid: generateUuid(),
    checked: true,
    children: [{ text: '添加斜杠命令菜单' }],
  },
  {
    type: 'task-list',
    indent: 0,
    uuid: generateUuid(),
    checked: false,
    children: [{ text: '开始创作你的内容！' }],
  },
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

function generateUuid() {
  return Math.random().toString(36).substring(2, 15)
}

function parseStoredValue(stored: string | null): Descendant[] {
  if (!stored) {
    return defaultValue
  }
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 检查是否包含旧的 'p' 类型节点，如果有则清空数据并返回默认值
      const hasOldFormat = parsed.some((node: any) => {
        return node && typeof node === 'object' && node.type === 'p'
      })

      if (hasOldFormat) {
        console.log('检测到旧格式数据，已清空并加载默认内容')
        storage.setMarkdownContent('')
        return defaultValue
      }

      return parsed as Descendant[]
    }
  } catch (e) {
    console.warn('Failed to parse stored markdown content, using default.', e)
  }
  return defaultValue
}

function renderElement(props: RenderElementProps) {
  const { attributes, children, element } = props
  const { type } = element

  switch (type) {
    case 'heading':
      return <HeadingComponent {...props} />
    case 'order-list':
    case 'bullet-list':
      return <ListComponent {...props} />
    case 'task-list':
      return <TaskListComponent {...props} />
    case 'quote':
      return <QuoteComponent {...props} />
    case 'code':
      return <CodeComponent {...props} />
    case 'table':
      return <Table {...props} />
    case 'table-row':
      return <TableRow {...props} />
    case 'table-cell':
      return <TableCell {...props} />
    default:
      return <ParagraphComponent {...props} />
  }
}

function renderLeaf(props: RenderLeafProps) {
  const { attributes, children, leaf } = props
  let content = children

  if (leaf.bold) {
    content = <strong>{content}</strong>
  }
  if (leaf.italic) {
    content = <em>{content}</em>
  }
  if (leaf.underline) {
    content = <u>{content}</u>
  }
  if (leaf.code) {
    content = <code className="inline-code">{content}</code>
  }

  return <span {...attributes}>{content}</span>
}

function ParagraphComponent(props: RenderElementProps) {
  const { attributes, children } = props
  return (
    <div {...attributes} className="paragraph">
      {children}
    </div>
  )
}

function HeadingComponent(props: RenderElementProps) {
  const { attributes, children, element } = props
  const { level } = element as HeadingElement
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
  const Tag = headingTags[level - 1]

  switch (level) {
    case 1:
      return (
        <h1 {...attributes} className={`heading heading-${level}`}>
          {children}
        </h1>
      )
    case 2:
      return (
        <h2 {...attributes} className={`heading heading-${level}`}>
          {children}
        </h2>
      )
    case 3:
      return (
        <h3 {...attributes} className={`heading heading-${level}`}>
          {children}
        </h3>
      )
    case 4:
      return (
        <h4 {...attributes} className={`heading heading-${level}`}>
          {children}
        </h4>
      )
    case 5:
      return (
        <h5 {...attributes} className={`heading heading-${level}`}>
          {children}
        </h5>
      )
    case 6:
      return (
        <h6 {...attributes} className={`heading heading-${level}`}>
          {children}
        </h6>
      )
    default:
      return (
        <h1 {...attributes} className={`heading heading-${level}`}>
          {children}
        </h1>
      )
  }
}

function ListComponent(props: RenderElementProps) {
  const { attributes, children, element } = props
  const editor = useSlateStatic()
  const { type, indent } = element as ListElement

  // 计算当前列表项的序号
  const index = useMemo(() => {
    try {
      const currentPath = (ReactEditor as any).findPath(editor, element)

      // 遍历文档中的所有节点，找到所有相同类型和缩进的列表项
      let count = 0

      for (const [node, path] of Editor.nodes(editor, {
        at: [],
        match: (n) => {
          if (!Element.isElement(n)) return false
          if (n.type !== 'order-list' && n.type !== 'bullet-list') return false
          const listNode = n as ListElement
          return listNode.type === type && listNode.indent === indent
        },
      })) {
        count++
        // 如果找到当前节点，返回计数
        if (Path.equals(path, currentPath)) {
          return count
        }
      }

      // 如果没找到（不应该发生），返回1
      return 1
    } catch {
      return 1
    }
  }, [editor, element, type, indent])

  const isOrdered = type === 'order-list'
  const marker = isOrdered ? `${index}.` : '•'

  return (
    <div {...attributes} className={`list-item ${type}`} style={{ paddingLeft: `${indent * 2}em` }}>
      <span className="list-marker">{marker}</span>
      <span className="list-content">{children}</span>
    </div>
  )
}

function QuoteComponent(props: RenderElementProps) {
  const { attributes, children } = props
  return (
    <blockquote {...attributes} className="quote">
      {children}
    </blockquote>
  )
}

function CodeComponent(props: RenderElementProps) {
  const { attributes, children } = props
  return (
    <pre {...attributes} className="code-block">
      <code>{children}</code>
    </pre>
  )
}

function TaskListComponent(props: RenderElementProps) {
  const { attributes, children, element } = props
  const editor = useSlateStatic()
  const { indent, checked } = element as TaskListElement

  const handleCheckboxChange = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      e.preventDefault()
      const path = ReactEditor.findPath(editor, element)
      // 直接基于当前状态取反，而不是依赖 e.target.checked
      Transforms.setNodes(editor, { checked: !checked } as any, { at: path })
    },
    [editor, element, checked]
  )

  return (
    <div {...attributes} className="task-list-item" style={{ paddingLeft: `${indent * 2}em` }}>
      <span contentEditable={false} className="task-list-checkbox-wrapper">
        <input
          type="checkbox"
          checked={checked}
          onMouseDown={handleCheckboxChange}
          className="task-list-checkbox"
        />
      </span>
      <span className="task-list-content">{children}</span>
    </div>
  )
}

export default function EditorComponent() {
  const editor = useMemo(() => withTable(withHistory(withReact(createEditor()))), [])

  // 初始化时从 storage 读取
  const [value, setValue] = useState<Descendant[]>(() => parseStoredValue(storage.getMarkdownContent()))

  // 斜杠命令菜单状态
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuSearch, setSlashMenuSearch] = useState('')
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  const slashMenuRef = useRef<HTMLDivElement>(null)

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      storage.setMarkdownContent(JSON.stringify(value))
    }, STORAGE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [value])

  const toggleFormat = useCallback(
    (format: 'bold' | 'italic' | 'underline' | 'code') => {
      const isActive = isFormatActive(editor, format)
      Transforms.setNodes(editor, { [format]: isActive ? null : true }, { match: Text.isText, split: true })
    },
    [editor],
  )

  const isFormatActive = (editor: Editor, format: 'bold' | 'italic' | 'underline' | 'code') => {
    const marks = Editor.marks(editor) as Partial<FormattedText> | null
    return marks ? marks[format] === true : false
  }

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { selection } = editor
      if (!selection) return

      // 处理斜杠命令菜单的 Escape 键关闭
      if (event.key === 'Escape' && showSlashMenu) {
        event.preventDefault()
        setShowSlashMenu(false)
        return
      }

      // 处理斜杠命令触发（兼容 Electron 和浏览器）
      const isSlashKey = event.key === '/' || event.code === 'Slash' || (event.keyCode === 191 && !event.shiftKey)
      if (isSlashKey) {
        const { selection } = editor
        if (selection && Range.isCollapsed(selection)) {
          const [block] = Editor.nodes(editor, {
            match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
            mode: 'lowest',
          })

          if (block) {
            const [node] = block
            if (Element.isElement(node) && node.type === 'paragraph') {
              const text = Node.string(node)
              // 只在空行或开头触发斜杠菜单
              if (text === '' || selection.anchor.offset === 0) {
                event.preventDefault()
                // 插入斜杠字符
                Transforms.insertText(editor, '/')
                setShowSlashMenu(true)
                setSlashMenuSearch('')

                // 获取光标位置
                const domSelection = window.getSelection()
                if (domSelection && domSelection.rangeCount > 0) {
                  const domRange = domSelection.getRangeAt(0)
                  const rect = domRange.getBoundingClientRect()
                  setSlashMenuPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                  })
                }
                return
              }
            }
          }
        }
      }

      // Tab 键处理列表缩进（包括任务列表）
      if (event.key === 'Tab') {
        event.preventDefault()
        const [match] = Editor.nodes(editor, {
          match: (node) =>
            Element.isElement(node) &&
            (node.type === 'order-list' || node.type === 'bullet-list' || node.type === 'task-list'),
        })

        if (match) {
          const node = match[0] as any
          let indent = node.indent || 0
          if (event.shiftKey) {
            indent = Math.max(0, indent - 1)
          } else {
            indent = Math.min(indent + 1, 10) // 限制最大缩进
          }
          Transforms.setNodes(editor, { indent } as any)
          return
        }
      }

      // Enter 键处理（包括任务列表）
      if (event.key === 'Enter') {
        const [match] = Editor.nodes(editor, {
          match: (node) =>
            Element.isElement(node) &&
            (node.type === 'order-list' || node.type === 'bullet-list' || node.type === 'task-list'),
        })

        if (match) {
          const [node, path] = match
          const listNode = node as ListElement | TaskListElement
          const { selection } = editor

          if (selection && Range.isCollapsed(selection)) {
            const [lineNode] = Editor.node(editor, selection.anchor.path.slice(0, -1))
            const isEmpty = Node.string(lineNode).trim() === ''

            if (isEmpty) {
              event.preventDefault()
              // 如果当前行为空，转换为段落
              Transforms.setNodes(editor, { type: 'paragraph' })
              Transforms.unwrapNodes(editor, {
                match: (n) =>
                  Element.isElement(n) &&
                  (n.type === 'order-list' || n.type === 'bullet-list' || n.type === 'task-list'),
              })
              return
            } else {
              // 如果当前行不为空，创建新的列表项
              event.preventDefault()

              if (listNode.type === 'task-list') {
                const taskNode = listNode as TaskListElement
                const newTaskItem: TaskListElement = {
                  type: 'task-list',
                  indent: taskNode.indent || 0,
                  uuid: generateUuid(),
                  checked: false,
                  children: [{ text: '' }],
                }
                Transforms.insertNodes(editor, newTaskItem)
              } else {
                const newListItem: ListElement = {
                  type: listNode.type as 'order-list' | 'bullet-list',
                  indent: listNode.indent || 0,
                  uuid: generateUuid(),
                  children: [{ text: '' }],
                }
                Transforms.insertNodes(editor, newListItem)
              }

              // 移动光标到新节点
              Transforms.move(editor)
              return
            }
          }
        }
      }

      // Backspace 键处理
      if (event.key === 'Backspace') {
        const { selection } = editor
        if (!selection || !Range.isCollapsed(selection)) return

        // 处理列表项（包括任务列表）
        const [listMatch] = Editor.nodes(editor, {
          match: (node) =>
            Element.isElement(node) &&
            (node.type === 'order-list' || node.type === 'bullet-list' || node.type === 'task-list'),
        })

        if (listMatch && selection) {
          const [node, path] = listMatch
          const start = Editor.start(editor, path)

          if (Point.equals(selection.anchor, start)) {
            event.preventDefault()
            // 在列表项开头按退格，转换为段落
            Transforms.setNodes(editor, { type: 'paragraph' })
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                Element.isElement(n) &&
                (n.type === 'order-list' || n.type === 'bullet-list' || n.type === 'task-list'),
            })
            return
          }
        }

        // 处理斜杠菜单关闭
        if (showSlashMenu) {
          const [block] = Editor.nodes(editor, {
            match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
            mode: 'lowest',
          })
          if (block) {
            const [node] = block
            const text = Node.string(node)
            if (text === '/') {
              setShowSlashMenu(false)
              setSlashMenuSearch('')
            } else if (text.startsWith('/')) {
              setSlashMenuSearch(text.slice(1, -1))
            }
          }
        }

        // 处理标题、引用、代码块：内容为空时转换为段落
        const [blockMatch] = Editor.nodes(editor, {
          match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
          mode: 'lowest',
        })

        if (blockMatch) {
          const [block, path] = blockMatch

          if (Element.isElement(block)) {
            const blockType = block.type

            // 检查是否是特殊块类型（标题、引用、代码块）
            if (blockType === 'heading' || blockType === 'quote' || blockType === 'code') {
              const blockText = Node.string(block).trim()
              const start = Editor.start(editor, path)
              const isAtStart = Point.equals(selection.anchor, start)

              // 如果内容为空且光标在开头，转换为段落
              if (blockText === '' && isAtStart) {
                event.preventDefault()
                // 转换为段落，移除特殊属性
                Transforms.setNodes(editor, { type: 'paragraph' }, { at: path })
                return
              }
            }
          }
        }
      }

      // Markdown 风格快捷键 - 按空格键触发
      if (event.key === ' ') {
        const { selection } = editor
        if (!selection || !Range.isCollapsed(selection)) return

        // 获取当前块级元素
        const [blockMatch] = Editor.nodes(editor, {
          match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
          mode: 'lowest',
        })

        if (blockMatch) {
          const [block, blockPath] = blockMatch

          // 只在段落类型时允许 Markdown 转换
          if (!Element.isElement(block) || block.type !== 'paragraph') return

          const blockStart = Editor.start(editor, blockPath)
          const cursor = selection.anchor

          // 获取从块开始到光标位置的文本
          const beforeText = Editor.string(editor, { anchor: blockStart, focus: cursor })

          // 只检查行首的文本（去除前导空白）
          const trimmedBefore = beforeText.trim()

          // 检查是否在行首（光标前只有空白字符和匹配的文本）
          // 并且匹配的文本长度不能太长（避免误触发）
          const isAtLineStart =
            (beforeText === trimmedBefore || beforeText.endsWith(trimmedBefore)) && trimmedBefore.length <= 10

          if (isAtLineStart && trimmedBefore.length > 0) {
            // 计算需要删除的文本范围
            const leadingSpaces = beforeText.length - trimmedBefore.length
            const deleteStart =
              leadingSpaces > 0 ? Editor.after(editor, blockStart, { distance: leadingSpaces }) : blockStart

            // 处理任务列表 (- [ ] 或 - [x])
            const taskListMatch = trimmedBefore.match(/^-\s*\[([ x])\]$/)
            if (taskListMatch && deleteStart) {
              event.preventDefault()
              const checked = taskListMatch[1] === 'x'
              Transforms.delete(editor, { at: { anchor: deleteStart, focus: cursor } })
              Transforms.setNodes(editor, {
                type: 'task-list',
                indent: 0,
                uuid: generateUuid(),
                checked,
              })
              return
            }

            // 处理标题 (#, ##, ###, etc.)
            const headingMatch = trimmedBefore.match(/^(#{1,6})$/)
            if (headingMatch && deleteStart) {
              event.preventDefault()
              const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6
              Transforms.delete(editor, { at: { anchor: deleteStart, focus: cursor } })
              Transforms.setNodes(editor, { type: 'heading', level })
              return
            }

            // 处理引用 (>)
            if (trimmedBefore === '>' && deleteStart) {
              event.preventDefault()
              Transforms.delete(editor, { at: { anchor: deleteStart, focus: cursor } })
              Transforms.setNodes(editor, { type: 'quote' })
              return
            }

            // 处理代码块 (```)
            if (trimmedBefore === '```' && deleteStart) {
              event.preventDefault()
              Transforms.delete(editor, { at: { anchor: deleteStart, focus: cursor } })
              Transforms.setNodes(editor, { type: 'code' })
              return
            }

            // 处理有序列表 (1., 2., etc.)
            const orderedListMatch = trimmedBefore.match(/^(\d+)\.$/)
            if (orderedListMatch && deleteStart) {
              event.preventDefault()
              Transforms.delete(editor, { at: { anchor: deleteStart, focus: cursor } })
              Transforms.setNodes(editor, {
                type: 'order-list',
                indent: 0,
                uuid: generateUuid(),
              })
              return
            }

            // 处理无序列表 (-, *)
            if ((trimmedBefore === '-' || trimmedBefore === '*') && deleteStart) {
              event.preventDefault()
              Transforms.delete(editor, { at: { anchor: deleteStart, focus: cursor } })
              Transforms.setNodes(editor, {
                type: 'bullet-list',
                indent: 0,
                uuid: generateUuid(),
              })
              return
            }
          }
        }
      }

      // 格式化快捷键
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault()
            toggleFormat('bold')
            break
          case 'i':
            event.preventDefault()
            toggleFormat('italic')
            break
          case 'u':
            event.preventDefault()
            toggleFormat('underline')
            break
          case '`':
            event.preventDefault()
            toggleFormat('code')
            break
        }
      }
    },
    [editor, toggleFormat, showSlashMenu],
  )

  return (
    <div className="winkdown-container">
      <Slate
        editor={editor}
        initialValue={value}
        onChange={(newValue) => {
          setValue(newValue)

          // 更新斜杠菜单搜索文本
          if (showSlashMenu) {
            const { selection } = editor
            if (selection && Range.isCollapsed(selection)) {
              const [block] = Editor.nodes(editor, {
                match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
                mode: 'lowest',
              })
              if (block) {
                const [node] = block
                const text = Node.string(node)
                if (text.startsWith('/')) {
                  setSlashMenuSearch(text.slice(1))
                } else {
                  setShowSlashMenu(false)
                  setSlashMenuSearch('')
                }
              }
            }
          }
        }}
      >
        <EditorToolbar />

        <TableToolbar />

        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          className="winkdown"
          onKeyDown={onKeyDown}
          placeholder="开始输入... 使用 / 打开命令菜单，# 创建标题，> 创建引用，- [ ] 创建任务列表"
        />

        <EditorStatusBar />
      </Slate>

      {showSlashMenu &&
        createPortal(
          <div
            ref={slashMenuRef}
            style={{
              position: 'absolute',
              top: slashMenuPosition.top,
              left: slashMenuPosition.left,
              zIndex: 1000,
            }}
          >
            <SlashMenu
              editor={editor}
              searchText={slashMenuSearch}
              onSelectCommand={() => {
                setShowSlashMenu(false)
                setSlashMenuSearch('')
                // 删除斜杠字符和搜索文本
                const { selection } = editor
                if (selection) {
                  const [block] = Editor.nodes(editor, {
                    match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
                    mode: 'lowest',
                  })
                  if (block) {
                    const [node, path] = block
                    const text = Node.string(node)
                    if (text.startsWith('/')) {
                      const start = Editor.start(editor, path)
                      const end = Editor.end(editor, path)
                      Transforms.delete(editor, {
                        at: {
                          anchor: start,
                          focus: { ...start, offset: text.length },
                        },
                      })
                    }
                  }
                }
              }}
            />
          </div>,
          document.body
        )}
    </div>
  )
}
