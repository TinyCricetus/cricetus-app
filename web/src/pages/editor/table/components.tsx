import React from 'react'
import { RenderElementProps, useSlateStatic, useSlate, ReactEditor } from 'slate-react'
import { Path, Transforms } from 'slate'
import { TableElement, TableCellElement } from './types'
import { getColSpan, getRowSpan, getTableAbove } from './queries'
import { getTableSelectionManager } from './selection'
import { TableContextMenu } from './context-menu'
import {
  insertTableRow,
  insertTableColumn,
  deleteRow,
  deleteColumn,
  mergeCells,
  splitCell,
  deleteTable,
  setCellAlign,
} from './transforms'
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Merge,
  Split,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'
import './table.css'

// 表格上下文，用于共享行高和调整状态
interface TableContextValue {
  rowHeights: number[]
  isResizing: boolean // 是否正在调整列宽/行高
}

const TableContext = React.createContext<TableContextValue>({ rowHeights: [], isResizing: false })

/**
 * 表格组件
 */
export function Table(props: RenderElementProps) {
  const { attributes, children, element } = props
  const editor = useSlateStatic() as ReactEditor
  const table = element as TableElement
  const colSizes = table.colSizes || []
  const rowHeights = table.rowHeights || []
  const maxHeight = table.maxHeight
  const stickyHeader = table.stickyHeader

  // 列宽调整状态
  const [resizingCol, setResizingCol] = React.useState<number | null>(null)
  const [resizingRow, setResizingRow] = React.useState<number | null>(null)
  const [startX, setStartX] = React.useState(0)
  const [startY, setStartY] = React.useState(0)
  const [startWidth, setStartWidth] = React.useState(0)
  const [startHeight, setStartHeight] = React.useState(0)

  const tableRef = React.useRef<HTMLTableElement>(null)

  // 处理列宽调整
  const handleColResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingCol(colIndex)
    setStartX(e.clientX)
    setStartWidth(colSizes[colIndex] || 150)
  }

  // 处理行高调整
  const handleRowResizeStart = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingRow(rowIndex)
    setStartY(e.clientY)

    // 从 DOM 获取实际行高
    let actualHeight = rowHeights[rowIndex] || 40
    if (tableRef.current) {
      const rows = tableRef.current.querySelectorAll('tr')
      if (rows[rowIndex]) {
        actualHeight = rows[rowIndex].getBoundingClientRect().height
      }
    }
    setStartHeight(actualHeight)
  }

  // 全局鼠标移动和松开处理
  React.useEffect(() => {
    if (resizingCol === null && resizingRow === null) return

    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol !== null) {
        const deltaX = e.clientX - startX
        const newWidth = Math.max(50, startWidth + deltaX)

        // 更新列宽
        const tablePath = ReactEditor.findPath(editor, element)
        const newColSizes = [...colSizes]
        while (newColSizes.length <= resizingCol) {
          newColSizes.push(150)
        }
        newColSizes[resizingCol] = newWidth

        Transforms.setNodes(editor, { colSizes: newColSizes } as Partial<TableElement>, { at: tablePath })
      }

      if (resizingRow !== null) {
        const deltaY = e.clientY - startY
        const newHeight = Math.max(24, startHeight + deltaY)

        // 更新行高
        const tablePath = ReactEditor.findPath(editor, element)
        const newRowHeights = [...rowHeights]
        while (newRowHeights.length <= resizingRow) {
          newRowHeights.push(40)
        }
        newRowHeights[resizingRow] = newHeight

        Transforms.setNodes(editor, { rowHeights: newRowHeights } as Partial<TableElement>, { at: tablePath })
      }
    }

    const handleMouseUp = () => {
      setResizingCol(null)
      setResizingRow(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingCol, resizingRow, startX, startY, startWidth, startHeight, colSizes, rowHeights, editor, element])

  // 计算表格总宽度
  const totalWidth = colSizes.reduce((sum, w) => sum + (w || 150), 0)

  // 渲染行高调整手柄
  const rowCount = (element as TableElement).children.length

  // 实际行底部位置（从 DOM 获取）
  const [actualRowBottoms, setActualRowBottoms] = React.useState<number[]>([])
  // 实际列右边界位置（从 DOM 获取）
  const [actualColRights, setActualColRights] = React.useState<number[]>([])

  // 使用 useLayoutEffect 获取实际渲染后的位置
  React.useLayoutEffect(() => {
    if (!tableRef.current) return

    const tableRect = tableRef.current.getBoundingClientRect()

    // 获取行位置
    const rows = tableRef.current.querySelectorAll('tr')
    const bottoms: number[] = []
    rows.forEach((row) => {
      const rect = row.getBoundingClientRect()
      bottoms.push(rect.bottom - tableRect.top)
    })
    setActualRowBottoms(bottoms)

    // 获取列位置（从第一行的单元格获取）
    const firstRow = tableRef.current.querySelector('tr')
    if (firstRow) {
      const cells = firstRow.querySelectorAll('td, th')
      const rights: number[] = []
      cells.forEach((cell) => {
        const rect = cell.getBoundingClientRect()
        rights.push(rect.right - tableRect.left)
      })
      setActualColRights(rights)
    }
  }, [rowHeights, colSizes, rowCount, children])

  // 是否正在调整大小
  const isResizing = resizingCol !== null || resizingRow !== null

  return (
    <TableContext.Provider value={{ rowHeights, isResizing }}>
      <div
        {...attributes}
        contentEditable={false}
        className={`slate-table-wrapper ${maxHeight ? 'has-scroll' : ''} ${stickyHeader ? 'sticky-header' : ''} ${resizingCol !== null ? 'resizing' : ''} ${resizingRow !== null ? 'resizing-row' : ''}`}
        style={{
          maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        }}
      >
        {/* 列宽调整指示器 */}
        {resizingCol !== null && <div className="col-resize-indicator" />}

        {/* 行高调整指示器 */}
        {resizingRow !== null && <div className="row-resize-indicator" />}

        <div className="table-scroll-container">
          <table ref={tableRef} className="slate-table" style={{ width: `${totalWidth}px` }}>
            <colgroup>
              {colSizes.map((width, index) => (
                <col key={index} style={{ width: `${width || 150}px` }} />
              ))}
            </colgroup>
            <tbody contentEditable={true} suppressContentEditableWarning={true}>
              {children}
            </tbody>
          </table>

          {/* 列宽调整手柄 */}
          <div className="col-resize-handles">
            {colSizes.map((_, index) => {
              // 使用实际的 DOM 位置，如果可用的话
              const left =
                actualColRights[index] ?? colSizes.slice(0, index + 1).reduce((sum, w) => sum + (w || 150), 0)
              return (
                <div
                  key={index}
                  className={`col-resize-handle ${resizingCol === index ? 'active' : ''}`}
                  style={{ left: `${left - 3}px` }}
                  onMouseDown={(e) => handleColResizeStart(e, index)}
                />
              )
            })}
          </div>

          {/* 行高调整手柄 */}
          <div className="row-resize-handles">
            {Array.from({ length: rowCount }, (_, index) => {
              // 使用实际的 DOM 位置，如果可用的话
              const top = actualRowBottoms[index] ?? (index + 1) * 40
              return (
                <div
                  key={index}
                  className={`row-resize-handle ${resizingRow === index ? 'active' : ''}`}
                  style={{ top: `${top - 4}px` }}
                  onMouseDown={(e) => handleRowResizeStart(e, index)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </TableContext.Provider>
  )
}

/**
 * 表格行组件
 */
export function TableRow(props: RenderElementProps) {
  const { attributes, children, element } = props
  const editor = useSlateStatic() as ReactEditor
  const { rowHeights } = React.useContext(TableContext)

  // 获取当前行的索引
  let rowIndex = 0
  try {
    const path = ReactEditor.findPath(editor, element)
    rowIndex = path[path.length - 1]
  } catch (e) {
    // 忽略错误
  }

  const height = rowHeights[rowIndex]

  return (
    <tr {...attributes} className="slate-table-row" style={{ height: height ? `${height}px` : undefined }}>
      {children}
    </tr>
  )
}

/**
 * 表格单元格组件
 */
export function TableCell(props: RenderElementProps) {
  const { attributes, children, element } = props
  const editor = useSlateStatic() as ReactEditor
  const cell = element as TableCellElement
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null)
  const { isResizing } = React.useContext(TableContext)

  const colSpan = getColSpan(cell)
  const rowSpan = getRowSpan(cell)

  const style: React.CSSProperties = {
    background: cell.background,
    textAlign: cell.align || 'left',
    borderTop: cell.borders?.top?.size
      ? `${cell.borders.top.size}px ${cell.borders.top.style || 'solid'} ${cell.borders.top.color || '#ddd'}`
      : undefined,
    borderRight: cell.borders?.right?.size
      ? `${cell.borders.right.size}px ${cell.borders.right.style || 'solid'} ${cell.borders.right.color || '#ddd'}`
      : undefined,
    borderBottom: cell.borders?.bottom?.size
      ? `${cell.borders.bottom.size}px ${cell.borders.bottom.style || 'solid'} ${cell.borders.bottom.color || '#ddd'}`
      : undefined,
    borderLeft: cell.borders?.left?.size
      ? `${cell.borders.left.size}px ${cell.borders.left.style || 'solid'} ${cell.borders.left.color || '#ddd'}`
      : undefined,
  }

  // TableSelectionManager, TableContextMenu 和 ReactEditor 已在文件顶部导入

  // 处理鼠标按下（开始框选）
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只处理左键
    if (e.button !== 0) return

    // 如果正在调整大小，禁用框选
    if (isResizing) return

    const selectionManager = getTableSelectionManager()
    const path = ReactEditor.findPath(editor, element)

    // 按住 Shift 或 Ctrl 开始框选
    if (e.shiftKey || e.ctrlKey) {
      e.preventDefault()
      selectionManager.startSelection(editor, path)
    } else {
      // 记录起始单元格，准备可能的拖拽框选
      selectionManager.clearSelection()
      selectionManager.setStartCell(path)
    }
  }

  // 处理鼠标进入（更新框选范围）
  const handleMouseEnter = (e: React.MouseEvent) => {
    // 如果正在调整大小，禁用框选
    if (isResizing) return

    const selectionManager = getTableSelectionManager()

    // 只在按住鼠标左键时更新选区
    if (e.buttons === 1) {
      const path = ReactEditor.findPath(editor, element)

      if (selectionManager.isSelectingMode) {
        selectionManager.updateSelection(path)
      } else {
        // 检查是否从另一个单元格拖拽进入
        const startCell = selectionManager.getStartCell()
        if (startCell && !Path.equals(startCell, path)) {
          // 清除浏览器原生选区
          window.getSelection()?.removeAllRanges()
          // 触发框选模式
          selectionManager.startSelection(editor, startCell)
          selectionManager.updateSelection(path)
        }
      }
    }
  }

  // 处理鼠标松开（结束框选）
  const handleMouseUp = () => {
    const selectionManager = getTableSelectionManager()
    selectionManager.endSelection()
  }

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const selectionManager = getTableSelectionManager()
    const path = ReactEditor.findPath(editor, element)

    // 如果右键的单元格不在选区内，清除之前的选区并选中当前单元格
    if (!selectionManager.hasSelection()) {
      selectionManager.clearSelection()
      selectionManager.startSelection(editor, path)
      selectionManager.endSelection()
    }

    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <td
        {...attributes}
        className="slate-table-cell"
        colSpan={colSpan}
        rowSpan={rowSpan}
        style={style}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {children}
      </td>

      {contextMenu && <TableContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} />}
    </>
  )
}

export function TableToolbar() {
  const editor = useSlate()
  const tableEntry = getTableAbove(editor)
  const ref = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)

  React.useLayoutEffect(() => {
    if (!tableEntry) {
      setPosition(null)
      return
    }

    const [tableNode] = tableEntry
    let animationFrameId: number

    const updatePosition = () => {
      try {
        const tableDom = ReactEditor.toDOMNode(editor as ReactEditor, tableNode)
        // Check if winkdown-container exists, otherwise use what we have (e.g. md-container or document)
        // In cricetus, the container class is .md-container or .md-editor-shell ?
        // The original winkdown code used .winkdown-container.
        // We should adjust this for cricetus structure if needed.
        // Let's assume .md-container or just document.documentElement for now to be safe.
        // Or better, let's look for a parent with relative positioning or the main container.
        const containerDom =
          tableDom.closest('.winkdown-container') || tableDom.closest('.md-container') || document.documentElement

        if (tableDom && containerDom && ref.current) {
          const tableRect = tableDom.getBoundingClientRect()

          const isWindow = containerDom === document.documentElement
          const containerRect = isWindow
            ? {
                top: 0,
                left: 0,
                right: window.innerWidth,
                bottom: window.innerHeight,
                width: window.innerWidth,
                height: window.innerHeight,
              }
            : containerDom.getBoundingClientRect()

          const toolbarRect = ref.current.getBoundingClientRect()

          const intersectionLeft = Math.max(tableRect.left, containerRect.left)
          const intersectionRight = Math.min(tableRect.right, containerRect.right)

          const visibleCenter = (intersectionLeft + intersectionRight) / 2

          const scrollLeft = isWindow ? window.scrollX : containerDom.scrollLeft
          const scrollTop = isWindow ? window.scrollY : containerDom.scrollTop
          const containerClientLeft = isWindow ? 0 : containerRect.left
          const containerClientTop = isWindow ? 0 : containerRect.top

          let toolLeft = visibleCenter - toolbarRect.width / 2

          const maxToolLeft = tableRect.right - toolbarRect.width
          const minToolLeft = tableRect.left

          toolLeft = Math.max(minToolLeft, Math.min(toolLeft, maxToolLeft))

          const finalLeft = toolLeft - containerClientLeft + scrollLeft

          let toolTopClient = tableRect.top - toolbarRect.height - 8

          if (toolTopClient < containerRect.top + 40) {
            if (tableRect.top < containerRect.top) {
              toolTopClient = Math.max(toolTopClient, containerRect.top + 5)
              toolTopClient = Math.min(toolTopClient, tableRect.bottom - toolbarRect.height - 5)
            }
          }

          const finalTop = toolTopClient - containerClientTop + scrollTop

          setPosition({ top: finalTop, left: finalLeft })
        }
      } catch (e) {
        // Ignore errors
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updatePosition)
    }

    updatePosition()

    window.addEventListener('resize', onScroll)

    let scrollContainer: Element | Window = window

    try {
      const tableDom = ReactEditor.toDOMNode(editor as ReactEditor, tableNode)
      const containerDom = tableDom.closest('.winkdown-container') || tableDom.closest('.md-container')
      if (containerDom) {
        scrollContainer = containerDom
      }
    } catch (e) {}

    scrollContainer.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', onScroll)
      scrollContainer.removeEventListener('scroll', onScroll)
    }
  }, [editor, tableEntry])

  if (!tableEntry) return null

  return (
    <div
      ref={ref}
      className="table-toolbar"
      style={{
        top: position ? `${position.top}px` : '-9999px',
        left: position ? `${position.left}px` : '-9999px',
        visibility: position ? 'visible' : 'hidden',
        opacity: position ? 1 : 0,
      }}
    >
      <div className="toolbar-group">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            insertTableRow(editor, { above: true })
          }}
          title="在上方插入行"
          className="toolbar-btn"
        >
          <ArrowUp size={16} />
        </button>

        <button
          onMouseDown={(e) => {
            e.preventDefault()
            insertTableRow(editor, { above: false })
          }}
          title="在下方插入行"
          className="toolbar-btn"
        >
          <ArrowDown size={16} />
        </button>
      </div>

      <div className="separator" />

      <div className="toolbar-group">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            insertTableColumn(editor, { before: true })
          }}
          title="在左侧插入列"
          className="toolbar-btn"
        >
          <ArrowLeft size={16} />
        </button>

        <button
          onMouseDown={(e) => {
            e.preventDefault()
            insertTableColumn(editor, { before: false })
          }}
          title="在右侧插入列"
          className="toolbar-btn"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="separator" />

      <div className="toolbar-group">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            deleteRow(editor)
          }}
          title="删除行"
          className="toolbar-btn danger-hover"
        >
          <div className="icon-stack">
            <span style={{ fontSize: 10, fontWeight: 700 }}>Row</span>
            <X size={14} className="overlay-icon" />
          </div>
        </button>

        <button
          onMouseDown={(e) => {
            e.preventDefault()
            deleteColumn(editor)
          }}
          title="删除列"
          className="toolbar-btn danger-hover"
        >
          <div className="icon-stack">
            <span style={{ fontSize: 10, fontWeight: 700 }}>Col</span>
            <X size={14} className="overlay-icon" />
          </div>
        </button>
      </div>

      <div className="separator" />

      <div className="toolbar-group">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            mergeCells(editor)
          }}
          title="合并单元格"
          className="toolbar-btn"
        >
          <Merge size={16} />
        </button>

        <button
          onMouseDown={(e) => {
            e.preventDefault()
            splitCell(editor)
          }}
          title="拆分单元格"
          className="toolbar-btn"
        >
          <Split size={16} />
        </button>
      </div>

      <div className="separator" />

      {/* 对齐按钮 */}
      <div className="toolbar-group">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            setCellAlign(editor, 'left')
          }}
          title="左对齐"
          className="toolbar-btn"
        >
          <AlignLeft size={16} />
        </button>

        <button
          onMouseDown={(e) => {
            e.preventDefault()
            setCellAlign(editor, 'center')
          }}
          title="居中对齐"
          className="toolbar-btn"
        >
          <AlignCenter size={16} />
        </button>

        <button
          onMouseDown={(e) => {
            e.preventDefault()
            setCellAlign(editor, 'right')
          }}
          title="右对齐"
          className="toolbar-btn"
        >
          <AlignRight size={16} />
        </button>
      </div>

      <div className="separator" />

      <button
        onMouseDown={(e) => {
          e.preventDefault()
          deleteTable(editor)
        }}
        title="删除表格"
        className="toolbar-btn danger"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
