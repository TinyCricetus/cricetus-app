import { Editor, Element, Transforms, Path } from 'slate'
import { TableElement, TableRowElement, TableCellElement, InsertTableOptions } from './types'
import { getTableAbove, getCellAbove, getRowAbove, getTableColumnCount } from './queries'
import { getTableSelectionManager } from './selection'

/**
 * 创建一个空单元格
 */
function createCell(): TableCellElement {
  return {
    type: 'table-cell',
    children: [{ type: 'paragraph', children: [{ text: '' }] }],
  }
}

/**
 * 创建一个表格行
 */
function createRow(colCount: number): TableRowElement {
  const cells: TableCellElement[] = []
  for (let i = 0; i < colCount; i++) {
    cells.push(createCell())
  }

  return {
    type: 'table-row',
    children: cells,
  }
}

/**
 * 插入表格
 */
export function insertTable(editor: Editor, options: InsertTableOptions = {}) {
  const { rowCount = 3, colCount = 3, colWidth = 150, rowHeight = 40 } = options

  const rows: TableRowElement[] = []
  for (let i = 0; i < rowCount; i++) {
    rows.push(createRow(colCount))
  }

  const colSizes = Array(colCount).fill(colWidth)
  const rowHeights = Array(rowCount).fill(rowHeight)

  const table: TableElement = {
    type: 'table',
    colSizes,
    rowHeights,
    children: rows,
  }

  Transforms.insertNodes(editor, table)

  // 插入后在表格后面添加一个段落，方便退出表格
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  })
}

/**
 * 删除表格
 */
export function deleteTable(editor: Editor) {
  const table = getTableAbove(editor)
  if (!table) return

  const [, tablePath] = table
  Transforms.removeNodes(editor, { at: tablePath })
}

/**
 * 插入行
 */
export function insertTableRow(editor: Editor, options: { above?: boolean } = {}) {
  const row = getRowAbove(editor)
  if (!row) return

  const [, rowPath] = row
  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode, tablePath] = table
  const tableElement = tableNode as TableElement
  const colCount = getTableColumnCount(tableElement)

  const newRow = createRow(colCount)
  const rowIndex = rowPath[rowPath.length - 1]
  const insertPath = options.above ? rowPath : Path.next(rowPath)
  const insertIndex = options.above ? rowIndex : rowIndex + 1

  Transforms.insertNodes(editor, newRow, { at: insertPath })

  // 更新行高数组
  if (tableElement.rowHeights) {
    const newRowHeights = [...tableElement.rowHeights]
    newRowHeights.splice(insertIndex, 0, 40) // 默认行高

    Transforms.setNodes(editor, { rowHeights: newRowHeights } as Partial<TableElement>, { at: tablePath })
  }
}

/**
 * 删除行
 */
export function deleteRow(editor: Editor) {
  const row = getRowAbove(editor)
  if (!row) return

  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode, tablePath] = table
  const tableElement = tableNode as TableElement
  const rowCount = tableElement.children.length

  // 至少保留一行
  if (rowCount <= 1) {
    return
  }

  const [, rowPath] = row
  const rowIndex = rowPath[rowPath.length - 1]

  Transforms.removeNodes(editor, { at: rowPath })

  // 更新行高数组
  if (tableElement.rowHeights) {
    const newRowHeights = [...tableElement.rowHeights]
    newRowHeights.splice(rowIndex, 1)

    Transforms.setNodes(editor, { rowHeights: newRowHeights } as Partial<TableElement>, { at: tablePath })
  }
}

/**
 * 插入列
 */
export function insertTableColumn(editor: Editor, options: { before?: boolean } = {}) {
  const cell = getCellAbove(editor)
  if (!cell) return

  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode, tablePath] = table
  const tableElement = tableNode as TableElement
  const [cellNode, cellPath] = cell

  // 获取当前单元格的列索引
  const colIndex = cellPath[cellPath.length - 1]

  // 在每一行的对应位置插入新单元格
  for (let rowIndex = 0; rowIndex < tableElement.children.length; rowIndex++) {
    const rowPath = [...tablePath, rowIndex]
    const cellInsertPath = options.before ? [...rowPath, colIndex] : [...rowPath, colIndex + 1]

    Transforms.insertNodes(editor, createCell(), { at: cellInsertPath })
  }

  // 更新列宽数组
  if (tableElement.colSizes) {
    const newColSizes = [...tableElement.colSizes]
    const insertIndex = options.before ? colIndex : colIndex + 1
    newColSizes.splice(insertIndex, 0, 150) // 默认新列宽度

    Transforms.setNodes(editor, { colSizes: newColSizes } as Partial<TableElement>, { at: tablePath })
  }
}

/**
 * 删除列
 */
export function deleteColumn(editor: Editor) {
  const cell = getCellAbove(editor)
  if (!cell) return

  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode, tablePath] = table
  const tableElement = tableNode as TableElement
  const colCount = getTableColumnCount(tableElement)

  // 至少保留一列
  if (colCount <= 1) {
    return
  }

  const [, cellPath] = cell
  const colIndex = cellPath[cellPath.length - 1]

  // 删除每一行的对应单元格
  for (let rowIndex = tableElement.children.length - 1; rowIndex >= 0; rowIndex--) {
    const cellDeletePath = [...tablePath, rowIndex, colIndex]
    Transforms.removeNodes(editor, { at: cellDeletePath })
  }

  // 更新列宽数组
  if (tableElement.colSizes) {
    const newColSizes = [...tableElement.colSizes]
    newColSizes.splice(colIndex, 1)

    Transforms.setNodes(editor, { colSizes: newColSizes } as Partial<TableElement>, { at: tablePath })
  }
}

/**
 * 合并单元格
 */
export function mergeCells(editor: Editor) {
  // 首先尝试从选区管理器获取选中的单元格
  const selectionManager = getTableSelectionManager()

  let cellPaths: Path[] = []

  if (selectionManager.hasSelection()) {
    // 使用框选的单元格
    cellPaths = selectionManager.getSelectedCells()
  } else if (editor.selection) {
    // 回退到使用编辑器选区
    const cells = Array.from(
      Editor.nodes(editor, {
        at: editor.selection,
        match: (n) => Element.isElement(n) && n.type === 'table-cell',
      }),
    )
    cellPaths = cells.map(([, path]) => path)
  }

  if (cellPaths.length < 2) {
    console.log('需要选中至少两个单元格才能合并')
    return
  }

  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode] = table

  // 找出选区的边界
  let minRow = Infinity
  let maxRow = -Infinity
  let minCol = Infinity
  let maxCol = -Infinity

  for (const cellPath of cellPaths) {
    const rowIndex = cellPath[cellPath.length - 2]
    const colIndex = cellPath[cellPath.length - 1]

    minRow = Math.min(minRow, rowIndex)
    maxRow = Math.max(maxRow, rowIndex)
    minCol = Math.min(minCol, colIndex)
    maxCol = Math.max(maxCol, colIndex)
  }

  const rowSpan = maxRow - minRow + 1
  const colSpan = maxCol - minCol + 1

  // 获取第一个单元格
  const firstCellPath = cellPaths[0]
  const [firstCell] = Editor.node(editor, firstCellPath)

  // 收集所有单元格的内容
  const allContent: any[] = []
  for (const cellPath of cellPaths) {
    const [cell] = Editor.node(editor, cellPath)
    if (Element.isElement(cell) && cell.type === 'table-cell') {
      const cellElement = cell as TableCellElement
      allContent.push(...cellElement.children)
    }
  }

  // 更新第一个单元格
  Transforms.setNodes(editor, { colSpan, rowSpan }, { at: firstCellPath })

  // 设置合并后的内容
  Transforms.removeNodes(editor, { at: [...firstCellPath, 0] })
  for (let i = allContent.length - 1; i >= 0; i--) {
    Transforms.insertNodes(editor, allContent[i], { at: [...firstCellPath, 0] })
  }

  // 删除其他单元格（从后往前删除）
  for (let i = cellPaths.length - 1; i > 0; i--) {
    const cellPath = cellPaths[i]
    Transforms.removeNodes(editor, { at: cellPath })
  }

  // 清除选区
  selectionManager.clearSelection()
}

/**
 * 拆分单元格
 */
export function splitCell(editor: Editor) {
  const cell = getCellAbove(editor)
  if (!cell) return

  const [cellNode, cellPath] = cell
  const cellElement = cellNode as TableCellElement

  const colSpan = (cellElement as any).colSpan || 1
  const rowSpan = (cellElement as any).rowSpan || 1

  // 如果单元格没有合并，不需要拆分
  if (colSpan === 1 && rowSpan === 1) return

  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode, tablePath] = table
  const tableElement = tableNode as TableElement

  const rowIndex = cellPath[cellPath.length - 2]
  const colIndex = cellPath[cellPath.length - 1]

  // 重置第一个单元格的 span
  Transforms.setNodes(editor, { colSpan: 1, rowSpan: 1 }, { at: cellPath })

  // 在被合并的位置插入新单元格
  for (let r = 0; r < rowSpan; r++) {
    const currentRowIndex = rowIndex + r
    if (currentRowIndex >= tableElement.children.length) continue

    for (let c = 0; c < colSpan; c++) {
      // 跳过第一个单元格（已经存在）
      if (r === 0 && c === 0) continue

      const insertPath = [...tablePath, currentRowIndex, colIndex + c]
      Transforms.insertNodes(editor, createCell(), { at: insertPath })
    }
  }
}

/**
 * 设置列宽
 */
export function setColumnWidth(editor: Editor, columnIndex: number, width: number) {
  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode, tablePath] = table
  const tableElement = tableNode as TableElement

  if (!tableElement.colSizes) return

  const newColSizes = [...tableElement.colSizes]
  if (columnIndex < newColSizes.length) {
    newColSizes[columnIndex] = width

    Transforms.setNodes(editor, { colSizes: newColSizes } as Partial<TableElement>, { at: tablePath })
  }
}

/**
 * 设置单元格对齐方式
 */
export function setCellAlign(editor: Editor, align: 'left' | 'center' | 'right') {
  const selectionManager = getTableSelectionManager()

  let cellPaths: Path[] = []

  if (selectionManager.hasSelection()) {
    cellPaths = selectionManager.getSelectedCells()
  } else {
    const cell = getCellAbove(editor)
    if (cell) {
      cellPaths = [cell[1]]
    }
  }

  for (const cellPath of cellPaths) {
    Transforms.setNodes(editor, { align } as Partial<TableCellElement>, { at: cellPath })
  }
}

/**
 * 设置行高
 */
export function setRowHeight(editor: Editor, rowIndex: number, height: number) {
  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode, tablePath] = table
  const tableElement = tableNode as TableElement

  // 更新行高数组
  const currentRowHeights = tableElement.rowHeights || []
  const newRowHeights = [...currentRowHeights]

  // 确保数组长度足够
  while (newRowHeights.length <= rowIndex) {
    newRowHeights.push(40) // 默认行高
  }

  newRowHeights[rowIndex] = Math.max(height, 24) // 最小行高 24px

  Transforms.setNodes(editor, { rowHeights: newRowHeights } as Partial<TableElement>, { at: tablePath })
}

/**
 * 设置表格最大高度（用于启用滚动）
 */
export function setTableMaxHeight(editor: Editor, maxHeight: number | undefined) {
  const table = getTableAbove(editor)
  if (!table) return

  const [, tablePath] = table

  Transforms.setNodes(editor, { maxHeight } as Partial<TableElement>, { at: tablePath })
}

/**
 * 切换固定表头
 */
export function toggleStickyHeader(editor: Editor) {
  const table = getTableAbove(editor)
  if (!table) return

  const [tableNode, tablePath] = table
  const tableElement = tableNode as TableElement

  Transforms.setNodes(editor, { stickyHeader: !tableElement.stickyHeader } as Partial<TableElement>, { at: tablePath })
}
