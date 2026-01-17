import { useSlate } from 'slate-react'
import { Editor, Transforms, Element } from 'slate'
import {
  Bold,
  Italic,
  Underline,
  Code,
  Quote,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  ChevronDown,
  Table as TableIcon,
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { HistoryEditor } from 'slate-history'
import { insertTable } from './table'
import './toolbar.css'

type FormatType = 'bold' | 'italic' | 'underline' | 'code'
type BlockType = 'paragraph' | 'heading' | 'quote' | 'code' | 'order-list' | 'bullet-list'

interface ToolbarButtonProps {
  active?: boolean
  disabled?: boolean
  onMouseDown: (e: React.MouseEvent) => void
  title: string
  children: React.ReactNode
}

function ToolbarButton({ active, disabled, onMouseDown, title, children }: ToolbarButtonProps) {
  return (
    <button
      className={`toolbar-button ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onMouseDown={onMouseDown}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="toolbar-divider" />
}

// 检查当前文本格式是否激活
function isMarkActive(editor: Editor, format: FormatType): boolean {
  const marks = Editor.marks(editor) as Record<string, boolean> | null
  return marks ? marks[format] === true : false
}

// 切换文本格式
function toggleMark(editor: Editor, format: FormatType) {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

// 检查块类型是否激活
function isBlockActive(editor: Editor, blockType: BlockType, level?: number): boolean {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => {
        if (!Element.isElement(n)) return false
        if (blockType === 'heading' && level) {
          return n.type === 'heading' && (n as any).level === level
        }
        return n.type === blockType
      },
    }),
  )

  return !!match
}

// 设置块类型
function setBlockType(editor: Editor, blockType: BlockType, properties: Record<string, any> = {}) {
  const isActive = isBlockActive(editor, blockType, properties.level)

  // 如果已经是这个类型，转换为段落
  if (isActive) {
    Transforms.setNodes(editor, { type: 'paragraph' } as any)
  } else {
    Transforms.setNodes(editor, { type: blockType, ...properties } as any)
  }
}

// 表格网格选择器
function TableGridSelector({
  onSelect,
  onClose,
}: {
  onSelect: (rows: number, cols: number) => void
  onClose: () => void
}) {
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const gridSize = 6

  return (
    <div className="table-grid-selector" onMouseLeave={onClose}>
      <div className="grid-label">{hoverRow > 0 ? `${hoverRow} × ${hoverCol}` : '选择表格大小'}</div>
      <div className="grid-container">
        {Array.from({ length: gridSize }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {Array.from({ length: gridSize }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`grid-cell ${rowIndex < hoverRow && colIndex < hoverCol ? 'highlighted' : ''}`}
                onMouseEnter={() => {
                  setHoverRow(rowIndex + 1)
                  setHoverCol(colIndex + 1)
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(rowIndex + 1, colIndex + 1)
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// 标题下拉菜单
function HeadingDropdown({ onSelect, onClose }: { onSelect: (level: number | null) => void; onClose: () => void }) {
  const options = [
    { level: null, label: '正文', icon: '¶' },
    { level: 1, label: '标题 1', icon: 'H1' },
    { level: 2, label: '标题 2', icon: 'H2' },
    { level: 3, label: '标题 3', icon: 'H3' },
    { level: 4, label: '标题 4', icon: 'H4' },
    { level: 5, label: '标题 5', icon: 'H5' },
    { level: 6, label: '标题 6', icon: 'H6' },
  ]

  return (
    <div className="heading-dropdown">
      {options.map((opt) => (
        <button
          key={opt.level ?? 'p'}
          className="dropdown-item"
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(opt.level)
            onClose()
          }}
        >
          <span className="dropdown-icon">{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

export function EditorToolbar() {
  const editor = useSlate()
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [showTableGrid, setShowTableGrid] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setShowHeadingMenu(false)
      }
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setShowTableGrid(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 获取当前标题级别
  const getCurrentHeadingLevel = useCallback((): number | null => {
    const { selection } = editor
    if (!selection) return null

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: (n) => Element.isElement(n) && n.type === 'heading',
      }),
    )

    if (match) {
      return (match[0] as any).level
    }
    return null
  }, [editor])

  const currentHeadingLevel = getCurrentHeadingLevel()
  const headingLabel = currentHeadingLevel ? `H${currentHeadingLevel}` : '正文'

  // 撤销/重做
  const canUndo = useMemo(() => {
    try {
      return (editor as any).history?.undos?.length > 0
    } catch {
      return false
    }
  }, [editor])

  const canRedo = useMemo(() => {
    try {
      return (editor as any).history?.redos?.length > 0
    } catch {
      return false
    }
  }, [editor])

  return (
    <div className="editor-main-toolbar">
      {/* 撤销/重做 */}
      <div className="toolbar-group">
        <ToolbarButton
          title="撤销 (Ctrl+Z)"
          disabled={!canUndo}
          onMouseDown={(e) => {
            e.preventDefault()
            HistoryEditor.undo(editor as any)
          }}
        >
          <Undo2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="重做 (Ctrl+Y)"
          disabled={!canRedo}
          onMouseDown={(e) => {
            e.preventDefault()
            HistoryEditor.redo(editor as any)
          }}
        >
          <Redo2 size={18} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* 标题选择 */}
      <div className="toolbar-group" ref={headingRef}>
        <div className="toolbar-dropdown-wrapper">
          <button
            className="toolbar-dropdown-button"
            onMouseDown={(e) => {
              e.preventDefault()
              setShowHeadingMenu(!showHeadingMenu)
            }}
          >
            <span>{headingLabel}</span>
            <ChevronDown size={14} />
          </button>
          {showHeadingMenu && (
            <HeadingDropdown
              onSelect={(level) => {
                if (level === null) {
                  Transforms.setNodes(editor, { type: 'paragraph' } as any)
                } else {
                  Transforms.setNodes(editor, { type: 'heading', level } as any)
                }
              }}
              onClose={() => setShowHeadingMenu(false)}
            />
          )}
        </div>
      </div>

      <ToolbarDivider />

      {/* 文本格式 */}
      <div className="toolbar-group">
        <ToolbarButton
          active={isMarkActive(editor, 'bold')}
          title="粗体 (Ctrl+B)"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleMark(editor, 'bold')
          }}
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          active={isMarkActive(editor, 'italic')}
          title="斜体 (Ctrl+I)"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleMark(editor, 'italic')
          }}
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          active={isMarkActive(editor, 'underline')}
          title="下划线 (Ctrl+U)"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleMark(editor, 'underline')
          }}
        >
          <Underline size={18} />
        </ToolbarButton>
        <ToolbarButton
          active={isMarkActive(editor, 'code')}
          title="行内代码 (Ctrl+`)"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleMark(editor, 'code')
          }}
        >
          <Code size={18} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* 块级元素 */}
      <div className="toolbar-group">
        <ToolbarButton
          active={isBlockActive(editor, 'quote')}
          title="引用块"
          onMouseDown={(e) => {
            e.preventDefault()
            setBlockType(editor, 'quote')
          }}
        >
          <Quote size={18} />
        </ToolbarButton>
        <ToolbarButton
          active={isBlockActive(editor, 'bullet-list')}
          title="无序列表"
          onMouseDown={(e) => {
            e.preventDefault()
            setBlockType(editor, 'bullet-list', { indent: 0, uuid: Math.random().toString(36).substring(2, 15) })
          }}
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          active={isBlockActive(editor, 'order-list')}
          title="有序列表"
          onMouseDown={(e) => {
            e.preventDefault()
            setBlockType(editor, 'order-list', { indent: 0, uuid: Math.random().toString(36).substring(2, 15) })
          }}
        >
          <ListOrdered size={18} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* 分隔线 / 代码块 */}
      <div className="toolbar-group">
        <ToolbarButton
          active={isBlockActive(editor, 'code')}
          title="代码块"
          onMouseDown={(e) => {
            e.preventDefault()
            setBlockType(editor, 'code')
          }}
        >
          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>{'{}'}</span>
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* 表格 */}
      <div className="toolbar-group" ref={tableRef}>
        <div className="toolbar-dropdown-wrapper">
          <button
            className="toolbar-dropdown-button table-button"
            onMouseDown={(e) => {
              e.preventDefault()
              setShowTableGrid(!showTableGrid)
            }}
          >
            <TableIcon size={18} />
            <ChevronDown size={14} />
          </button>
          {showTableGrid && (
            <TableGridSelector
              onSelect={(rows, cols) => {
                insertTable(editor, { rowCount: rows, colCount: cols })
                setShowTableGrid(false)
              }}
              onClose={() => setShowTableGrid(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
