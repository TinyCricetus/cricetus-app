import { Editor, Element, Path, NodeEntry } from 'slate'
import { TableElement, TableRowElement, TableCellElement, CellPosition, TableGrid } from './types'

/**
 * 获取当前选区所在的表格元素
 */
export function getTableAbove(editor: Editor): NodeEntry<TableElement> | undefined {
  if (!editor.selection) return undefined

  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === 'table',
    mode: 'lowest',
  })

  return match as NodeEntry<TableElement> | undefined
}

/**
 * 获取当前选区所在的单元格
 */
export function getCellAbove(editor: Editor): NodeEntry<TableCellElement> | undefined {
  if (!editor.selection) return undefined

  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === 'table-cell',
    mode: 'lowest',
  })

  return match as NodeEntry<TableCellElement> | undefined
}

/**
 * 获取当前选区所在的行
 */
export function getRowAbove(editor: Editor): NodeEntry<TableRowElement> | undefined {
  if (!editor.selection) return undefined

  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === 'table-row',
    mode: 'lowest',
  })

  return match as NodeEntry<TableRowElement> | undefined
}

/**
 * 获取单元格的 colspan
 */
export function getColSpan(cell: TableCellElement): number {
  return cell.colSpan || 1
}

/**
 * 获取单元格的 rowspan
 */
export function getRowSpan(cell: TableCellElement): number {
  return cell.rowSpan || 1
}

/**
 * 获取表格的列数
 */
export function getTableColumnCount(table: TableElement): number {
  if (table.colSizes) {
    return table.colSizes.length
  }

  // 从第一行计算列数
  const firstRow = table.children[0] as TableRowElement | undefined
  if (!firstRow) return 0

  let colCount = 0
  for (const cell of firstRow.children) {
    if (Element.isElement(cell) && cell.type === 'table-cell') {
      colCount += getColSpan(cell as TableCellElement)
    }
  }

  return colCount
}

/**
 * 获取表格的行数
 */
export function getTableRowCount(table: TableElement): number {
  return table.children.length
}

/**
 * 获取单元格在表格中的位置
 */
export function getCellPosition(editor: Editor, cellPath: Path): CellPosition | undefined {
  const tablePath = cellPath.slice(0, -2)
  const rowIndex = cellPath[cellPath.length - 2]

  const [table] = Editor.node(editor, tablePath)
  if (!Element.isElement(table) || table.type !== 'table') {
    return undefined
  }

  const tableElement = table as TableElement
  let colIndex = 0

  // 计算列索引（考虑 colspan）
  const rowPath = cellPath.slice(0, -1)
  const [row] = Editor.node(editor, rowPath)

  if (!Element.isElement(row) || row.type !== 'table-row') {
    return undefined
  }

  const cellIndex = cellPath[cellPath.length - 1]
  const rowElement = row as TableRowElement

  for (let i = 0; i < cellIndex; i++) {
    const cell = rowElement.children[i] as TableCellElement
    colIndex += getColSpan(cell)
  }

  return { row: rowIndex, col: colIndex }
}

/**
 * 将表格转换为网格结构（用于合并操作）
 */
export function buildTableGrid(table: TableElement): TableGrid {
  const rowCount = table.children.length
  const colCount = getTableColumnCount(table)

  // 创建网格，初始化为 null
  const grid: (TableCellElement | null)[][] = Array(rowCount)
    .fill(null)
    .map(() => Array(colCount).fill(null))

  // 填充网格
  let currentRow = 0
  for (const rowNode of table.children) {
    if (!Element.isElement(rowNode) || rowNode.type !== 'table-row') continue

    const row = rowNode as TableRowElement
    let currentCol = 0

    for (const cellNode of row.children) {
      if (!Element.isElement(cellNode) || cellNode.type !== 'table-cell') continue

      const cell = cellNode as TableCellElement

      // 找到下一个空位置
      while (currentCol < colCount && grid[currentRow][currentCol] !== null) {
        currentCol++
      }

      if (currentCol >= colCount) break

      const colspan = getColSpan(cell)
      const rowspan = getRowSpan(cell)

      // 填充合并的单元格
      for (let r = 0; r < rowspan && currentRow + r < rowCount; r++) {
        for (let c = 0; c < colspan && currentCol + c < colCount; c++) {
          grid[currentRow + r][currentCol + c] = cell
        }
      }

      currentCol += colspan
    }

    currentRow++
  }

  return { cells: grid, rowCount, colCount }
}

/**
 * 检查选区是否跨越多个单元格
 */
export function isSelectionAcrossCells(editor: Editor): boolean {
  if (!editor.selection) return false

  const cells = Array.from(
    Editor.nodes(editor, {
      at: editor.selection,
      match: (n) => Element.isElement(n) && n.type === 'table-cell',
    }),
  )

  return cells.length > 1
}
